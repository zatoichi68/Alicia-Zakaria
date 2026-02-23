import React, { useState } from 'react';
import Search from 'lucide-react/dist/esm/icons/search';
import Globe from 'lucide-react/dist/esm/icons/globe';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import { useLanguage } from '../context/LanguageContext';

interface SearchSource {
  uri: string;
  title: string;
}

export const SearchAssistant: React.FC = () => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [sources, setSources] = useState<SearchSource[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResponse('');
    setSources([]);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      if (!res.ok) {
        throw new Error('Search failed');
      }

      const data = await res.json();
      setResponse(data.text || t("Je n'ai pas trouvé de réponse, désolé.", "I couldn't find an answer, sorry."));
      setSources((data.sources || []) as SearchSource[]);

    } catch (error) {
      console.error(error);
      setResponse(t('Une erreur est survenue lors de la recherche. Veuillez réessayer.', 'An error occurred during search. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Search Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-3">
          <Globe className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          {t('Assistant de Recherche', 'Search Assistant')}
        </h2>
        
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Posez une question (ex: Météo à Montréal, Recette de pâté chinois...)', 'Ask a question (e.g., weather in Montreal, tourtière recipe...)')}
            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 pr-32 text-xl text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 top-2 bottom-2 bg-blue-600 dark:bg-blue-700 text-white px-6 rounded-xl font-bold text-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
          </button>
        </form>
      </div>

      {/* Results */}
      {(response || loading) && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-6 min-h-[300px] transition-colors">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 dark:text-slate-500 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400" />
              <p className="text-xl animate-pulse">{t('Recherche en cours...', 'Searching...')}</p>
            </div>
          ) : (
            <>
              <div className="prose prose-xl prose-slate dark:prose-invert max-w-none">
                <p className="leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-200">{response}</p>
              </div>

              {sources.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-6">
                  <h3 className="text-lg font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">{t('Sources Consultées', 'Sources')}</h3>
                  <div className="grid gap-3">
                    {sources.map((source, idx) => (
                      <a 
                        key={idx}
                        href={source.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-slate-600 transition-colors group"
                      >
                        <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 group-hover:border-blue-200 dark:group-hover:border-slate-500">
                          <Globe className="w-5 h-5 text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
                        </div>
                        <span className="flex-1 font-medium text-slate-700 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-300 truncate">
                          {source.title || source.uri}
                        </span>
                        <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
      
      {!response && !loading && (
        <div className="text-center py-12 text-slate-400 dark:text-slate-600">
            <Search className="w-24 h-24 mx-auto mb-4 opacity-20" />
            <p className="text-xl">{t('Posez une question pour commencer.', 'Ask a question to get started.')}</p>
        </div>
      )}
    </div>
  );
};
