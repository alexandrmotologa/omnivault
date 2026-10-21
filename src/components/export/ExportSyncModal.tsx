import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import {
  Download,
  Upload,
  FileCode2,
  FolderArchive,
  Database,
  CheckCircle,
  Loader2,
  FileText,
} from 'lucide-react';
import { exportVaultToObsidianZip } from '../../lib/export/obsidian';
import { exportVaultToLogseqZip } from '../../lib/export/logseq';
import { createFullBackupBlob, downloadBlob, restoreFromJsonFile } from '../../lib/export/backup';
import { Article, Highlight } from '../../lib/db/types';

interface ExportSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
  highlights: Highlight[];
  onReloadVault: () => Promise<void>;
}

export const ExportSyncModal: React.FC<ExportSyncModalProps> = ({
  isOpen,
  onClose,
  articles,
  highlights,
  onReloadVault,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleExportObsidian = async () => {
    setIsExporting(true);
    try {
      const zipBlob = await exportVaultToObsidianZip(articles, highlights);
      downloadBlob(zipBlob, `Omnivault-Obsidian-${new Date().toISOString().split('T')[0]}.zip`);
    } catch (err: any) {
      alert('Failed exporting Obsidian vault: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportLogseq = async () => {
    setIsExporting(true);
    try {
      const zipBlob = await exportVaultToLogseqZip(articles, highlights);
      downloadBlob(zipBlob, `Omnivault-Logseq-${new Date().toISOString().split('T')[0]}.zip`);
    } catch (err: any) {
      alert('Failed exporting Logseq package: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJson = async () => {
    setIsExporting(true);
    try {
      const jsonBlob = await createFullBackupBlob();
      downloadBlob(jsonBlob, `omnivault-backup-${new Date().toISOString().split('T')[0]}.json`);
    } catch (err: any) {
      alert('Failed exporting JSON backup: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileImport = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsImporting(true);
    setImportStatus(null);

    try {
      const result = await restoreFromJsonFile(file);
      await onReloadVault();
      setImportStatus(`Successfully restored ${result.importedCount} items into your research vault!`);
    } catch (err: any) {
      setImportStatus(`Import failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sync & Export Vault" maxWidth="max-w-xl">
      <div className="space-y-6 text-xs">
        {/* Obsidian Export Card */}
        <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 hover:border-purple-500/40 transition-colors space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                <FolderArchive className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                  Export to Obsidian Vault (.zip)
                </h4>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Creates Markdown notes with YAML frontmatter and callouts (`&gt; [!quote]`, `&gt; [!note]`).
                </p>
              </div>
            </div>
            <button
              onClick={handleExportObsidian}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export ZIP</span>
            </button>
          </div>
        </div>

        {/* Logseq Export Card */}
        <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 hover:border-emerald-500/40 transition-colors space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                  Export to Logseq (.zip)
                </h4>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Formats articles and margin notes as outliner hierarchical bullet points.
                </p>
              </div>
            </div>
            <button
              onClick={handleExportLogseq}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export ZIP</span>
            </button>
          </div>
        </div>

        {/* Full JSON Backup */}
        <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 hover:border-blue-500/40 transition-colors space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                  Complete JSON Backup
                </h4>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Full atomic export of articles, highlights, annotations, and RSS feeds.
                </p>
              </div>
            </div>
            <button
              onClick={handleExportJson}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON</span>
            </button>
          </div>
        </div>

        {/* Import JSON / Omnivore migration */}
        <div className="p-4 rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-card)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-blue-500" />
                Restore Backup or Import Omnivore Data
              </h4>
              <p className="text-[11px] text-[var(--text-muted)]">
                Seamlessly import Omnivore exported archives (.json) or previous Omnivault backups.
              </p>
            </div>

            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] font-medium border border-[var(--border-color)]">
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Choose File</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                disabled={isImporting}
                onChange={(e) => handleFileImport(e.target.files)}
              />
            </label>
          </div>

          {isImporting && (
            <div className="flex items-center gap-2 text-xs text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Importing and indexing documents with SQLite FTS5...</span>
            </div>
          )}

          {importStatus && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
