import { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Download, Save, Trash2, Calendar, MapPin, Plus, AlertCircle, Copy, FileText } from 'lucide-react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useApp } from '../context/AppContext';
import { scrapeEmiratesOpenDays, ScrapedOpenDay as BaseScrapedOpenDay } from '../services/webScraperService';

interface ScrapedOpenDay extends BaseScrapedOpenDay {
  id: string;
  editable?: boolean;
}

export default function EmiratesWebScraper() {
  const { currentUser } = useApp();
  const [url, setUrl] = useState('https://www.emiratesgroupcareers.com/cabin-crew/');
  const [loading, setLoading] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedOpenDay[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pasteData, setPasteData] = useState('');
  const [showPasteSection, setShowPasteSection] = useState(false);

  const handleScrape = async () => {
    if (!url.trim()) {
      alert('Please enter a URL');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('Starting scrape for URL:', url);
      const scrapedEvents = await scrapeEmiratesOpenDays(url);

      const eventsWithIds = scrapedEvents.map((event, index) => ({
        ...event,
        id: `scraped-${Date.now()}-${index}`,
        editable: true
      }));

      setScrapedData(eventsWithIds);

      if (eventsWithIds.length > 0) {
        alert(`Successfully extracted ${eventsWithIds.length} Open Day events! You can edit them below before saving.`);
      } else {
        setError('No events found. Using sample data that you can edit.');
      }
    } catch (error) {
      console.error('Error scraping:', error);
      setError('Failed to scrape data. Using sample data that you can edit.');

      const fallbackEvents = await scrapeEmiratesOpenDays(url).catch(() => []);
      const eventsWithIds = fallbackEvents.map((event, index) => ({
        ...event,
        id: `fallback-${Date.now()}-${index}`,
        editable: true
      }));
      setScrapedData(eventsWithIds);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string, field: keyof ScrapedOpenDay, value: string) => {
    setScrapedData(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleDelete = (id: string) => {
    setScrapedData(prev => prev.filter(item => item.id !== id));
  };

  const handleSaveAll = async () => {
    if (!currentUser) return;

    if (scrapedData.length === 0) {
      alert('No events to save');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to save ${scrapedData.length} Open Day event(s) to the database?`
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const openDaysRef = collection(db, 'open_days');
      let savedCount = 0;

      for (const event of scrapedData) {
        if (!event.city || !event.date) {
          console.warn('Skipping event with missing data:', event);
          continue;
        }

        await addDoc(openDaysRef, {
          city: event.city,
          country: event.country,
          date: event.date,
          recruiter: event.recruiter || 'Emirates Group',
          description: event.description || `Open Day in ${event.city}`,
          created_by: currentUser.uid,
          created_at: Timestamp.now(),
          last_updated: Timestamp.now()
        });
        savedCount++;
      }

      alert(`Successfully saved ${savedCount} Open Day event(s)! Check the Open Days page to view them.`);
      setScrapedData([]);
      setUrl('https://www.emiratesgroupcareers.com/cabin-crew/');
      setError(null);
    } catch (error) {
      console.error('Error saving open days:', error);
      alert('Failed to save open days to database. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddManual = () => {
    const newEvent: ScrapedOpenDay = {
      id: Date.now().toString(),
      city: '',
      country: '',
      date: '',
      recruiter: 'Emirates Group',
      description: '',
      editable: true
    };
    setScrapedData(prev => [...prev, newEvent]);
  };

  const handleParsePastedData = () => {
    if (!pasteData.trim()) {
      alert('Please paste some data first');
      return;
    }

    try {
      const lines = pasteData.split('\n').filter(line => line.trim());
      const parsedEvents: ScrapedOpenDay[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (!line) continue;

        const datePattern = /(\d{1,2}[\s\/\-]\w+[\s\/\-]\d{2,4}|\d{1,2}[\s\/\-]\d{1,2}[\s\/\-]\d{2,4})/;
        const dateMatch = line.match(datePattern);

        let city = line;
        let dateStr = '';
        let time = '';
        let venue = '';

        if (dateMatch) {
          const parts = line.split(dateMatch[0]);
          city = parts[0].trim();
          dateStr = dateMatch[0];

          const remaining = parts[1]?.trim() || '';
          const timeParts = remaining.split(/[\s,\-]+/);

          if (timeParts.length > 0) {
            time = timeParts.find(p => p.match(/\d{1,2}:\d{2}|AM|PM/i)) || '';
            venue = timeParts.filter(p => !p.match(/\d{1,2}:\d{2}|AM|PM/i)).join(' ').trim();
          }
        }

        if (city) {
          const countryGuess = guessCountryFromCity(city);

          parsedEvents.push({
            id: `pasted-${Date.now()}-${i}`,
            city: city,
            country: countryGuess,
            date: parseDate(dateStr),
            time: time,
            venue: venue,
            recruiter: 'Emirates Group',
            description: `Cabin Crew Open Day - ${city}`,
            editable: true
          });
        }
      }

      if (parsedEvents.length > 0) {
        setScrapedData(prev => [...prev, ...parsedEvents]);
        alert(`Successfully parsed ${parsedEvents.length} events! Review and edit them below before saving.`);
        setPasteData('');
        setShowPasteSection(false);
      } else {
        alert('Could not parse any events from the pasted data. Please try manual entry.');
      }
    } catch (error) {
      console.error('Error parsing pasted data:', error);
      alert('Failed to parse pasted data. Please try manual entry instead.');
    }
  };

  const guessCountryFromCity = (city: string): string => {
    const cityMap: { [key: string]: string } = {
      'Dubai': 'United Arab Emirates', 'Abu Dhabi': 'United Arab Emirates', 'Sharjah': 'United Arab Emirates',
      'London': 'United Kingdom', 'Manchester': 'United Kingdom', 'Birmingham': 'United Kingdom', 'Glasgow': 'United Kingdom',
      'Sydney': 'Australia', 'Melbourne': 'Australia', 'Brisbane': 'Australia',
      'Singapore': 'Singapore',
      'Mumbai': 'India', 'Delhi': 'India', 'Bangalore': 'India', 'Chennai': 'India',
      'Cairo': 'Egypt', 'Alexandria': 'Egypt',
      'Johannesburg': 'South Africa', 'Cape Town': 'South Africa',
      'Nairobi': 'Kenya',
      'Amman': 'Jordan',
      'Beirut': 'Lebanon',
      'Paris': 'France',
      'Madrid': 'Spain', 'Barcelona': 'Spain',
      'Rome': 'Italy', 'Milan': 'Italy',
      'Berlin': 'Germany', 'Frankfurt': 'Germany',
      'Toronto': 'Canada', 'Vancouver': 'Canada',
      'New York': 'United States', 'Los Angeles': 'United States',
      'Istanbul': 'Turkey',
      'Bangkok': 'Thailand',
      'Manila': 'Philippines',
      'Jakarta': 'Indonesia',
      'Kuala Lumpur': 'Malaysia'
    };

    for (const [cityName, country] of Object.entries(cityMap)) {
      if (city.includes(cityName)) {
        return country;
      }
    }
    return 'United Arab Emirates';
  };

  const parseDate = (dateStr: string): string => {
    if (!dateStr) {
      const future = new Date();
      future.setMonth(future.getMonth() + 1);
      return future.toISOString().split('T')[0];
    }

    try {
      const cleaned = dateStr.replace(/(\d+)(st|nd|rd|th)/g, '$1').trim();
      const parsed = new Date(cleaned);

      if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2020) {
        return parsed.toISOString().split('T')[0];
      }

      const future = new Date();
      future.setMonth(future.getMonth() + 1);
      return future.toISOString().split('T')[0];
    } catch {
      const future = new Date();
      future.setMonth(future.getMonth() + 1);
      return future.toISOString().split('T')[0];
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#D71921] to-[#B91518] text-white rounded-2xl p-6"
      >
        <div className="flex items-center gap-3">
          <Globe className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">Emirates Open Days Web Scraper</h1>
            <p className="text-white/90 mt-1">Extract and import Open Day events from Emirates website</p>
          </div>
        </div>
      </motion.div>

      {error && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-yellow-900">Note</h3>
            <p className="text-sm text-yellow-800 mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Import Open Days Data</h2>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-blue-900 mb-2">How to Get Real Open Days Data:</h3>
              <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                <li>Visit <a href="https://www.emiratesgroupcareers.com/cabin-crew/" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-blue-600">Emirates Careers Portal</a></li>
                <li>Select a country from the dropdown list on the page</li>
                <li>Wait for the open days to load for that country</li>
                <li>Copy the list of open days (highlight and Ctrl+C / Cmd+C)</li>
                <li>Click "Paste Data" below and paste the copied text</li>
                <li>We'll automatically parse the cities, dates, and venues</li>
                <li>Review, edit if needed, then save to database</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {!showPasteSection ? (
            <div className="flex gap-3">
              <button
                onClick={() => setShowPasteSection(true)}
                className="flex-1 bg-gradient-to-r from-[#D71921] to-[#B91518] text-white py-3 rounded-xl font-bold hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <Copy className="w-5 h-5" />
                Paste Data from Emirates Portal
              </button>
              <button
                onClick={handleAddManual}
                className="px-6 py-3 border-2 border-[#D71921] text-[#D71921] rounded-xl font-bold hover:bg-[#D71921] hover:text-white transition flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Manually
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Paste Open Days Data Here
                </label>
                <textarea
                  value={pasteData}
                  onChange={(e) => setPasteData(e.target.value)}
                  placeholder="Paste the open days data from Emirates website here...&#10;&#10;Example format:&#10;Dubai - 15 December 2024 - 09:00 AM - Dubai World Trade Centre&#10;London - 20 January 2025 - 10:00 AM - ExCeL London&#10;Mumbai - 5 February 2025 - 11:00 AM"
                  rows={8}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71921] focus:outline-none transition font-mono text-sm"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Paste the text from the Emirates portal. The system will try to extract cities, dates, times, and venues automatically.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleParsePastedData}
                  disabled={!pasteData.trim()}
                  className="flex-1 bg-gradient-to-r from-[#D71921] to-[#B91518] text-white py-3 rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Parse & Import Data
                </button>
                <button
                  onClick={() => {
                    setShowPasteSection(false);
                    setPasteData('');
                  }}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {scrapedData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Scraped Events ({scrapedData.length})
            </h2>
            <button
              onClick={handleSaveAll}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-bold transition disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save All to Database
            </button>
          </div>

          <div className="space-y-4">
            {scrapedData.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-2 border-gray-200 rounded-xl p-4 hover:border-[#D71921] transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          City
                        </label>
                        <input
                          type="text"
                          value={event.city}
                          onChange={(e) => handleEdit(event.id, 'city', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#D71921] focus:outline-none text-sm"
                          placeholder="e.g., Dubai"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          <Globe className="w-3 h-3 inline mr-1" />
                          Country
                        </label>
                        <input
                          type="text"
                          value={event.country}
                          onChange={(e) => handleEdit(event.id, 'country', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#D71921] focus:outline-none text-sm"
                          placeholder="e.g., United Arab Emirates"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          Date
                        </label>
                        <input
                          type="date"
                          value={event.date}
                          onChange={(e) => handleEdit(event.id, 'date', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#D71921] focus:outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          Recruiter
                        </label>
                        <input
                          type="text"
                          value={event.recruiter}
                          onChange={(e) => handleEdit(event.id, 'recruiter', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#D71921] focus:outline-none text-sm"
                          placeholder="e.g., Emirates Airlines"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">
                        Description
                      </label>
                      <textarea
                        value={event.description}
                        onChange={(e) => handleEdit(event.id, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#D71921] focus:outline-none text-sm resize-none"
                        placeholder="Event description..."
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(event.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete event"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <h3 className="font-bold text-blue-900 mb-2">How to use:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
          <li>Enter the Emirates Open Days URL above</li>
          <li>Click "Scrape Data" to extract events from the website</li>
          <li>Review and edit the extracted data as needed</li>
          <li>Click "Save All to Database" to import events into the Open Days section</li>
          <li>You can also add events manually using the "Add Manually" button</li>
        </ol>
        <p className="text-xs text-blue-700 mt-3">
          <strong>Note:</strong> This is a demo version. In production, web scraping would be handled by a backend service to avoid CORS issues.
        </p>
      </div>
    </div>
  );
}
