import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Chapter from '../models/Chapter.js';
import ContentItem from '../models/ContentItem.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STUDY_CONTENT_PATH = process.env.STUDY_CONTENT_PATH || path.join(__dirname, '../../../study-content');
const SUBJECTS = ['Maths', 'Physics', 'Chemistry'];

const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.webm', '.avi', '.mov'];
const DOCUMENT_EXTENSIONS = ['.pdf', '.docx', '.pptx', '.doc', '.ppt'];

function getItemType(ext) {
  if (VIDEO_EXTENSIONS.includes(ext)) return 'local_video';
  if (ext === '.pdf') return 'pdf';
  return 'document';
}

function getContentType(ext) {
  if (VIDEO_EXTENSIONS.includes(ext)) return 'lecture';
  return null; // Will be set based on folder
}

async function getVideoDuration(filePath) {
  try {
    const { default: ffmpeg } = await import('fluent-ffmpeg');
    return new Promise((resolve) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err || !metadata) {
          resolve(0);
          return;
        }
        resolve(Math.floor(metadata.format.duration || 0));
      });
    });
  } catch {
    return 0;
  }
}

function scanDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  try {
    return fs.readdirSync(dirPath).filter(f => {
      const fullPath = path.join(dirPath, f);
      return fs.statSync(fullPath).isFile();
    });
  } catch {
    return [];
  }
}

function getChapterOrder(chapterName) {
  const match = chapterName.match(/chapter\s+(\d+)/i);
  if (match) return parseInt(match[1]);
  const numMatch = chapterName.match(/^(\d+)/);
  if (numMatch) return parseInt(numMatch[1]);
  return 999;
}

export async function scanSubject(subject) {
  const subjectPath = path.join(STUDY_CONTENT_PATH, subject);
  if (!fs.existsSync(subjectPath)) {
    console.log(`Subject path not found: ${subjectPath}`);
    return;
  }

  const chapterDirs = fs.readdirSync(subjectPath).filter(d => {
    const fullPath = path.join(subjectPath, d);
    return fs.statSync(fullPath).isDirectory();
  });

  for (const chapterDir of chapterDirs) {
    const chapterFolderPath = path.join(subject, chapterDir);
    const absoluteChapterPath = path.join(subjectPath, chapterDir);

    // Find or create chapter
    let chapter = await Chapter.findOne({ folderPath: chapterFolderPath });
    if (!chapter) {
      const order = getChapterOrder(chapterDir);
      chapter = new Chapter({
        subject,
        name: chapterDir,
        folderPath: chapterFolderPath,
        order
      });
      await chapter.save();
      console.log(`Created chapter: ${chapterDir}`);
    }

    // Scan Lectures folder
    const lecturesPath = path.join(absoluteChapterPath, 'Lectures');
    const lectureFiles = scanDirectory(lecturesPath);
    let lectureOrder = 0;

    for (const file of lectureFiles) {
      const ext = path.extname(file).toLowerCase();
      if (!VIDEO_EXTENSIONS.includes(ext)) continue;

      const relativePath = path.join(chapterFolderPath, 'Lectures', file);
      const existing = await ContentItem.findOne({ filePath: relativePath });

      if (!existing) {
        const absoluteFilePath = path.join(lecturesPath, file);
        const duration = await getVideoDuration(absoluteFilePath);

        const item = new ContentItem({
          chapterId: chapter._id,
          subject,
          chapterName: chapter.name,
          type: 'lecture',
          itemType: 'local_video',
          name: path.basename(file, ext),
          filePath: relativePath,
          order: lectureOrder++,
          duration
        });
        await item.save();
        console.log(`Added lecture: ${file}`);
      } else {
        lectureOrder = Math.max(lectureOrder, existing.order + 1);
      }
    }

    // Scan Notes folder
    const notesPath = path.join(absoluteChapterPath, 'Notes');
    const noteFiles = scanDirectory(notesPath);
    let notesOrder = 0;

    for (const file of noteFiles) {
      const ext = path.extname(file).toLowerCase();
      if (!DOCUMENT_EXTENSIONS.includes(ext)) continue;

      const relativePath = path.join(chapterFolderPath, 'Notes', file);
      const existing = await ContentItem.findOne({ filePath: relativePath });

      if (!existing) {
        const item = new ContentItem({
          chapterId: chapter._id,
          subject,
          chapterName: chapter.name,
          type: 'notes',
          itemType: getItemType(ext),
          name: path.basename(file, ext),
          filePath: relativePath,
          order: notesOrder++
        });
        await item.save();
        console.log(`Added note: ${file}`);
      } else {
        notesOrder = Math.max(notesOrder, existing.order + 1);
      }
    }

    // Scan Worksheets folder
    const worksheetsPath = path.join(absoluteChapterPath, 'Worksheets');
    const worksheetFiles = scanDirectory(worksheetsPath);
    let worksheetsOrder = 0;

    for (const file of worksheetFiles) {
      const ext = path.extname(file).toLowerCase();
      if (!DOCUMENT_EXTENSIONS.includes(ext)) continue;

      const relativePath = path.join(chapterFolderPath, 'Worksheets', file);
      const existing = await ContentItem.findOne({ filePath: relativePath });

      if (!existing) {
        const item = new ContentItem({
          chapterId: chapter._id,
          subject,
          chapterName: chapter.name,
          type: 'worksheet',
          itemType: getItemType(ext),
          name: path.basename(file, ext),
          filePath: relativePath,
          order: worksheetsOrder++
        });
        await item.save();
        console.log(`Added worksheet: ${file}`);
      } else {
        worksheetsOrder = Math.max(worksheetsOrder, existing.order + 1);
      }
    }
  }
}

export async function scanAllSubjects() {
  for (const subject of SUBJECTS) {
    try {
      await scanSubject(subject);
    } catch (err) {
      console.error(`Error scanning ${subject}:`, err.message);
    }
  }
}

export { STUDY_CONTENT_PATH };
