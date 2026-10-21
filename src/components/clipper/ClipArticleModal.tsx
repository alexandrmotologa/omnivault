import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Globe, FileText, Upload, Loader2, Sparkles, BookOpen } from 'lucide-react';
import { fetchAndExtractUrl } from '../../lib/clipper/fetcher';
import { extractArticleFromHtml } from '../../lib/clipper/extract';
import { parseEpubFile } from '../../lib/clipper/epub';
import { parsePdfFile } from '../../lib/clipper/pdf';
import { Article } from '../../lib/db/types';

interface ClipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveArticle: (article: Article) => Promise<void>;
}

export const ClipArticleModal: React.FC<ClipModalProps> = ({
  isOpen,
  onClose,
  onSaveArticle,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'paste' | 'file'>('url');

  // URL state
  const [targetUrl, setTargetUrl] = useState('');
  const [urlTags, setUrlTags] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Paste state
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteSource, setPasteSource] = useState('');
  const [pasteBody, setPasteBody] = useState('');
  const [pasteTags, setPasteTags] = useState('');

  // File state
  const [dragActive, setDragActive] = useState(false);

  const resetForm = () => {
    setTargetUrl('');
    setUrlTags('');
    setPasteTitle('');
    setPasteSource('');
    setPasteBody('');
    setPasteTags('');
    setErrorMessage('');
    setIsLoading(false);
  };

  const handleFetchUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.trim()) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const extracted = await fetchAndExtractUrl(targetUrl);
      const parsedTags = urlTags
        .split(',')
        .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
        .filter(Boolean);

      const article: Article = {
        id: 'art-' + Math.random().toString(36).substring(2, 9),
        url: targetUrl.trim(),
        title: extracted.title,
        byline: extracted.byline,
        excerpt: extracted.excerpt,
        content_html: extracted.content_html,
        content_markdown: extracted.content_markdown,
        site_name: extracted.site_name,
        published_at: extracted.published_at,
        saved_at: new Date().toISOString(),
        read_at: null,
        status: 'inbox',
        favorite: 0,
        reading_time_minutes: extracted.reading_time_minutes,
        word_count: extracted.word_count,
        scroll_progress: 0,
        tags: parsedTags,
        rss_source_id: null,
      };

      await onSaveArticle(article);
      resetForm();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to extract clean webpage content.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePaste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteTitle.trim() || !pasteBody.trim()) {
      setErrorMessage('Please provide both a title and article content.');
      return;
    }

    try {
      const extracted = extractArticleFromHtml(pasteBody, pasteSource);
      const parsedTags = pasteTags
        .split(',')
        .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
        .filter(Boolean);

      const article: Article = {
        id: 'art-' + Math.random().toString(36).substring(2, 9),
        url: pasteSource.trim() || 'https://omnivault.local/pasted',
        title: pasteTitle.trim(),
        byline: extracted.byline,
        excerpt: extracted.excerpt || pasteBody.slice(0, 160),
        content_html: extracted.content_html,
        content_markdown: extracted.content_markdown || pasteBody,
        site_name: extracted.site_name || 'Note',
        published_at: new Date().toISOString(),
        saved_at: new Date().toISOString(),
        read_at: null,
        status: 'inbox',
        favorite: 0,
        reading_time_minutes: extracted.reading_time_minutes,
        word_count: extracted.word_count,
        scroll_progress: 0,
        tags: parsedTags,
        rss_source_id: null,
      };

      await onSaveArticle(article);
      resetForm();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed saving article.');
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsLoading(true);
    setErrorMessage('');

    try {
      let extracted;
      const lower = file.name.toLowerCase();

      if (lower.endsWith('.epub')) {
        extracted = await parseEpubFile(file);
      } else if (lower.endsWith('.pdf')) {
        extracted = await parsePdfFile(file);
      } else {
        const text = await file.text();
        extracted = extractArticleFromHtml(text);
      }

      const article: Article = {
        id: 'art-' + Math.random().toString(36).substring(2, 9),
        url: 'file://' + file.name,
        title: extracted.title || file.name,
        byline: extracted.byline,
        excerpt: extracted.excerpt,
        content_html: extracted.content_html,
        content_markdown: extracted.content_markdown,
        site_name: lower.endsWith('.epub') ? 'EPUB Book' : lower.endsWith('.pdf') ? 'PDF Paper' : 'Document',
        published_at: extracted.published_at,
        saved_at: new Date().toISOString(),
        read_at: null,
        status: 'inbox',
        favorite: 0,
        reading_time_minutes: extracted.reading_time_minutes,
        word_count: extracted.word_count,
        scroll_progress: 0,
        tags: [lower.endsWith('.epub') ? 'epub' : lower.endsWith('.pdf') ? 'pdf' : 'file'],
        rss_source_id: null,
      };

      await onSaveArticle(article);
      resetForm();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not parse dropped file.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Save to Omnivault"
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex border-b border-[var(--border-color)]">
          <button
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'url'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Web URL</span>
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'paste'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste Text / HTML</span>
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'file'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>EPUB / HTML File</span>
          </button>
        </div>

        {errorMessage && (
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
            {errorMessage}
          </div>
        )}

        {/* Tab 1: URL Fetch */}
        {activeTab === 'url' && (
          <form onSubmit={handleFetchUrl} className="space-y-3 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--text-secondary)]">
                Webpage URL
              </label>
              <input
                type="url"
                required
                autoFocus
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com/deep-dive-into-distributed-systems"
                className="w-full text-xs px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--text-secondary)]">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={urlTags}
                onChange={(e) => setUrlTags(e.target.value)}
                placeholder="systems, architecture, research"
                className="w-full text-xs px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Scraping & Indexing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Extract Clean Article</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Paste Content */}
        {activeTab === 'paste' && (
          <form onSubmit={handleSavePaste} className="space-y-3 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--text-secondary)]">Title</label>
              <input
                type="text"
                required
                value={pasteTitle}
                onChange={(e) => setPasteTitle(e.target.value)}
                placeholder="Title of the article or paper"
                className="w-full text-xs px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-secondary)]">
                  Source URL (optional)
                </label>
                <input
                  type="text"
                  value={pasteSource}
                  onChange={(e) => setPasteSource(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-xs px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-secondary)]">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={pasteTags}
                  onChange={(e) => setPasteTags(e.target.value)}
                  placeholder="algorithms, math"
                  className="w-full text-xs px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--text-secondary)]">
                Content (HTML or Markdown)
              </label>
              <textarea
                required
                rows={6}
                value={pasteBody}
                onChange={(e) => setPasteBody(e.target.value)}
                placeholder="Paste the raw text, HTML or Markdown content here..."
                className="w-full text-xs p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
              >
                Save Article
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Drop EPUB / HTML File */}
        {activeTab === 'file' && (
          <div className="space-y-4 pt-1">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                handleFileUpload(e.dataTransfer.files);
              }}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                dragActive
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-[var(--border-color)] bg-[var(--bg-secondary)]/20 hover:border-blue-400'
              }`}
            >
              <div className="space-y-3">
                <BookOpen className="w-10 h-10 mx-auto text-blue-500/80" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[var(--text-primary)]">
                    Drag and drop your files here
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Supports <span className="font-semibold">.pdf</span> research papers,{' '}
                    <span className="font-semibold">.epub</span> books,{' '}
                    <span className="font-semibold">.html</span>, and{' '}
                    <span className="font-semibold">.md</span>
                  </p>
                </div>

                <label className="inline-block">
                  <input
                    type="file"
                    accept=".pdf,.epub,.html,.htm,.md,.txt"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                  <span className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    Browse Files
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
