import type { IconType } from 'react-icons';
import {
  RiFileExcel2Line,
  RiFileLine,
  RiFileMusicLine,
  RiFilePdf2Line,
  RiFilePpt2Line,
  RiFileTextLine,
  RiFileVideoLine,
  RiFileWord2Line,
  RiFileZipLine,
  RiImageLine,
  RiCodeLine,
} from 'react-icons/ri';
import { cx } from '@/components/ui';

interface Kind {
  icon: IconType;
  color: string;
}

const EXT: Record<string, Kind> = {
  pdf: { icon: RiFilePdf2Line, color: 'text-nyx-coral' },
  doc: { icon: RiFileWord2Line, color: 'text-nyx-violet' },
  docx: { icon: RiFileWord2Line, color: 'text-nyx-violet' },
  xls: { icon: RiFileExcel2Line, color: 'text-nyx-mint' },
  xlsx: { icon: RiFileExcel2Line, color: 'text-nyx-mint' },
  csv: { icon: RiFileExcel2Line, color: 'text-nyx-mint' },
  ppt: { icon: RiFilePpt2Line, color: 'text-nyx-gold' },
  pptx: { icon: RiFilePpt2Line, color: 'text-nyx-gold' },
  zip: { icon: RiFileZipLine, color: 'text-nyx-muted' },
  rar: { icon: RiFileZipLine, color: 'text-nyx-muted' },
  '7z': { icon: RiFileZipLine, color: 'text-nyx-muted' },
  txt: { icon: RiFileTextLine, color: 'text-slate-300' },
  md: { icon: RiFileTextLine, color: 'text-slate-300' },
  js: { icon: RiCodeLine, color: 'text-nyx-gold' },
  ts: { icon: RiCodeLine, color: 'text-nyx-violet' },
  py: { icon: RiCodeLine, color: 'text-nyx-mint' },
  java: { icon: RiCodeLine, color: 'text-nyx-coral' },
};

function kindFor(fileName: string, mime: string | null): Kind {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (EXT[ext]) return EXT[ext];
  if (mime?.startsWith('image/')) return { icon: RiImageLine, color: 'text-nyx-gold' };
  if (mime?.startsWith('video/')) return { icon: RiFileVideoLine, color: 'text-nyx-coral' };
  if (mime?.startsWith('audio/')) return { icon: RiFileMusicLine, color: 'text-nyx-mint' };
  if (mime?.startsWith('text/')) return { icon: RiFileTextLine, color: 'text-slate-300' };
  return { icon: RiFileLine, color: 'text-nyx-muted' };
}

export default function FileIcon({ fileName, mime, className }: { fileName: string; mime: string | null; className?: string }) {
  const { icon: Icon, color } = kindFor(fileName, mime);
  return <Icon aria-hidden size={22} className={cx('shrink-0', color, className)} />;
}
