import { db } from '../lib/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  updateDoc,
  doc,
  increment,
  getDoc,
} from 'firebase/firestore';
import { openaiClient } from '../utils/openaiClient';

export type ModerationCategory =
  | 'spam'
  | 'harassment'
  | 'scam'
  | 'off-topic'
  | 'explicit'
  | 'hate-speech'
  | 'violence'
  | 'self-harm'
  | 'fraud';

export type ModerationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ModerationAction = 'allow' | 'warn' | 'block' | 'ban' | 'escalate';

export interface ModerationResult {
  allowed: boolean;
  severity: ModerationSeverity;
  categories: ModerationCategory[];
  action: ModerationAction;
  reason: string;
  confidence: number;
  aiAnalysis?: string;
  ruleViolations?: string[];
}

export interface ModerationLog {
  id?: string;
  userId: string;
  userName: string;
  contentType: 'post' | 'comment' | 'chat' | 'marketplace' | 'profile';
  contentId?: string;
  content: string;
  severity: ModerationSeverity;
  categories: ModerationCategory[];
  action: ModerationAction;
  reason: string;
  confidence: number;
  aiAnalysis?: string;
  ruleViolations?: string[];
  timestamp: Timestamp;
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  status: 'pending' | 'reviewed' | 'appealed' | 'resolved';
  appealReason?: string;
}

export interface ModerationInsights {
  totalViolations: number;
  violationsByCategory: Record<ModerationCategory, number>;
  violationsBySeverity: Record<ModerationSeverity, number>;
  topOffenders: Array<{ userId: string; userName: string; count: number }>;
  recentViolations: ModerationLog[];
  pendingAppeals: number;
}

class AIModerationService {
  private badWords = [
    'spam',
    'scam',
    'fake',
    'fraud',
    'phishing',
    'click here',
    'buy now',
    'limited time',
    'act now',
    'free money',
    'get rich',
    'work from home',
    'nigga',
    'fucking',
    'shit',
    'bitch',
    'asshole',
    'damn',
    'cunt',
    'dick',
  ];

  private spamPatterns = [
    /\b(buy|click|visit|check\s+out)\s+(now|here|this)/gi,
    /\b(limited\s+time|act\s+now|hurry|don't\s+miss)/gi,
    /\b(free\s+money|get\s+rich|make\s+\$\d+)/gi,
    /https?:\/\/[^\s]+/gi,
    /\b\w+\.com\b/gi,
  ];

  private async checkRuleBasedFilters(content: string): Promise<{
    violations: string[];
    severity: ModerationSeverity;
  }> {
    const violations: string[] = [];
    const lowerContent = content.toLowerCase();

    for (const word of this.badWords) {
      if (lowerContent.includes(word.toLowerCase())) {
        violations.push(`Contains inappropriate word: "${word}"`);
      }
    }

    for (const pattern of this.spamPatterns) {
      if (pattern.test(content)) {
        violations.push(`Matches spam pattern: ${pattern.source}`);
      }
    }

    if (content.length > 5000) {
      violations.push('Content too long (possible spam)');
    }

    const urlCount = (content.match(/https?:\/\//g) || []).length;
    if (urlCount > 3) {
      violations.push(`Too many URLs: ${urlCount}`);
    }

    const capsPercentage = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsPercentage > 0.7 && content.length > 20) {
      violations.push('Excessive caps (possible spam)');
    }

    let severity: ModerationSeverity = 'LOW';
    if (violations.length >= 3) severity = 'MEDIUM';
    if (violations.length >= 5) severity = 'HIGH';

    return { violations, severity };
  }

  private async analyzeWithAI(
    content: string,
    contentType: string
  ): Promise<{
    categories: ModerationCategory[];
    severity: ModerationSeverity;
    confidence: number;
    analysis: string;
  }> {
    try {
      const prompt = `You are a content moderation AI. Analyze the following ${contentType} content and provide a JSON response.

Content: "${content}"

Evaluate for:
1. Spam/promotional content
2. Harassment/bullying
3. Scams/fraud
4. Off-topic content
5. Explicit/inappropriate content
6. Hate speech
7. Violence
8. Self-harm
9. Fraudulent schemes

Respond in JSON format:
{
  "categories": ["spam", "harassment", etc],
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "confidence": 0.0-1.0,
  "analysis": "brief explanation"
}`;

      const response = await openaiClient.sendMessage(
        [{ role: 'user', content: prompt }],
        'system-moderation'
      );

      const result = JSON.parse(response.reply || '{}');

      return {
        categories: result.categories || [],
        severity: result.severity || 'LOW',
        confidence: result.confidence || 0.5,
        analysis: result.analysis || 'No analysis available',
      };
    } catch (error) {
      console.error('AI moderation analysis failed:', error);
      return {
        categories: [],
        severity: 'LOW',
        confidence: 0,
        analysis: 'AI analysis unavailable',
      };
    }
  }

  private determineAction(
    severity: ModerationSeverity,
    categories: ModerationCategory[],
    userViolationCount: number
  ): ModerationAction {
    if (severity === 'CRITICAL') return 'ban';
    if (severity === 'HIGH') {
      return userViolationCount >= 3 ? 'ban' : 'escalate';
    }
    if (severity === 'MEDIUM') {
      return userViolationCount >= 5 ? 'escalate' : 'block';
    }
    return userViolationCount >= 10 ? 'warn' : 'allow';
  }

  async moderateContent(
    userId: string,
    userName: string,
    content: string,
    contentType: 'post' | 'comment' | 'chat' | 'marketplace' | 'profile',
    contentId?: string
  ): Promise<ModerationResult> {
    const ruleCheck = await this.checkRuleBasedFilters(content);
    const aiAnalysis = await this.analyzeWithAI(content, contentType);

    const allCategories = [...new Set(aiAnalysis.categories)] as ModerationCategory[];
    const maxSeverity =
      ruleCheck.severity === 'HIGH' || aiAnalysis.severity === 'HIGH'
        ? 'HIGH'
        : ruleCheck.severity === 'MEDIUM' || aiAnalysis.severity === 'MEDIUM'
        ? 'MEDIUM'
        : 'LOW';

    const userViolations = await this.getUserViolationCount(userId);
    const action = this.determineAction(maxSeverity, allCategories, userViolations);

    const result: ModerationResult = {
      allowed: action === 'allow' || action === 'warn',
      severity: maxSeverity,
      categories: allCategories,
      action,
      reason: this.generateReason(allCategories, ruleCheck.violations),
      confidence: aiAnalysis.confidence,
      aiAnalysis: aiAnalysis.analysis,
      ruleViolations: ruleCheck.violations,
    };

    if (action !== 'allow') {
      await this.logViolation({
        userId,
        userName,
        contentType,
        contentId,
        content,
        severity: maxSeverity,
        categories: allCategories,
        action,
        reason: result.reason,
        confidence: aiAnalysis.confidence,
        aiAnalysis: aiAnalysis.analysis,
        ruleViolations: ruleCheck.violations,
        timestamp: Timestamp.now(),
        status: action === 'escalate' ? 'pending' : 'reviewed',
      });
    }

    if (action === 'ban') {
      await this.applyBan(userId, maxSeverity);
    }

    return result;
  }

  private generateReason(categories: ModerationCategory[], violations: string[]): string {
    const reasons: string[] = [];

    if (categories.includes('spam')) reasons.push('spam content');
    if (categories.includes('harassment')) reasons.push('harassment/bullying');
    if (categories.includes('scam')) reasons.push('potential scam');
    if (categories.includes('fraud')) reasons.push('fraudulent content');
    if (categories.includes('explicit')) reasons.push('explicit content');
    if (categories.includes('hate-speech')) reasons.push('hate speech');

    if (violations.length > 0) {
      reasons.push(...violations.slice(0, 2));
    }

    return reasons.length > 0
      ? `Content flagged for: ${reasons.join(', ')}`
      : 'Content violated community guidelines';
  }

  private async getUserViolationCount(userId: string): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const q = query(
      collection(db, 'moderation_logs'),
      where('userId', '==', userId),
      where('timestamp', '>=', Timestamp.fromDate(thirtyDaysAgo))
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  private async logViolation(log: ModerationLog): Promise<void> {
    await addDoc(collection(db, 'moderation_logs'), log);

    const userRef = doc(db, 'users', log.userId);
    await updateDoc(userRef, {
      moderationViolations: increment(1),
      lastViolation: log.timestamp,
    });
  }

  private async applyBan(userId: string, severity: ModerationSeverity): Promise<void> {
    const banDuration = severity === 'CRITICAL' ? 30 : severity === 'HIGH' ? 7 : 1;
    const banUntil = new Date();
    banUntil.setDate(banUntil.getDate() + banDuration);

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      banned: true,
      banUntil: Timestamp.fromDate(banUntil),
      banReason: `Automated ban due to ${severity} severity violation`,
    });
  }

  async getInsights(): Promise<ModerationInsights> {
    const logsRef = collection(db, 'moderation_logs');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const q = query(
      logsRef,
      where('timestamp', '>=', Timestamp.fromDate(thirtyDaysAgo)),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ModerationLog));

    const violationsByCategory: Record<ModerationCategory, number> = {
      spam: 0,
      harassment: 0,
      scam: 0,
      'off-topic': 0,
      explicit: 0,
      'hate-speech': 0,
      violence: 0,
      'self-harm': 0,
      fraud: 0,
    };

    const violationsBySeverity: Record<ModerationSeverity, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };

    const userViolations: Record<string, { userName: string; count: number }> = {};

    logs.forEach((log) => {
      log.categories.forEach((cat) => {
        violationsByCategory[cat]++;
      });

      violationsBySeverity[log.severity]++;

      if (!userViolations[log.userId]) {
        userViolations[log.userId] = { userName: log.userName, count: 0 };
      }
      userViolations[log.userId].count++;
    });

    const topOffenders = Object.entries(userViolations)
      .map(([userId, data]) => ({ userId, userName: data.userName, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const pendingAppeals = logs.filter((log) => log.status === 'appealed').length;

    return {
      totalViolations: logs.length,
      violationsByCategory,
      violationsBySeverity,
      topOffenders,
      recentViolations: logs.slice(0, 20),
      pendingAppeals,
    };
  }

  async submitAppeal(logId: string, appealReason: string): Promise<void> {
    const logRef = doc(db, 'moderation_logs', logId);
    await updateDoc(logRef, {
      status: 'appealed',
      appealReason,
      appealedAt: Timestamp.now(),
    });
  }

  async reviewAppeal(logId: string, approved: boolean, reviewedBy: string): Promise<void> {
    const logRef = doc(db, 'moderation_logs', logId);
    const logDoc = await getDoc(logRef);

    if (!logDoc.exists()) return;

    const log = logDoc.data() as ModerationLog;

    await updateDoc(logRef, {
      status: 'resolved',
      reviewedBy,
      reviewedAt: Timestamp.now(),
    });

    if (approved && log.userId) {
      const userRef = doc(db, 'users', log.userId);
      await updateDoc(userRef, {
        banned: false,
        banUntil: null,
        banReason: null,
        moderationViolations: increment(-1),
      });
    }
  }

  async checkUserBanStatus(userId: string): Promise<{
    banned: boolean;
    banUntil?: Date;
    banReason?: string;
  }> {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return { banned: false };
    }

    const userData = userDoc.data();

    if (userData.banned && userData.banUntil) {
      const banUntil = userData.banUntil.toDate();
      if (banUntil < new Date()) {
        await updateDoc(userRef, {
          banned: false,
          banUntil: null,
          banReason: null,
        });
        return { banned: false };
      }

      return {
        banned: true,
        banUntil,
        banReason: userData.banReason,
      };
    }

    return { banned: false };
  }
}

export const aiModerationService = new AIModerationService();
