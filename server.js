import express from 'express';
import multer from 'multer';
import nodemailer from 'nodemailer';
import fs from 'fs';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

function createTransporter() {
  const secure = String(process.env.SMTP_SECURE || 'true').toLowerCase() === 'true';
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || (secure ? 465 : 587)),
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.json({ ok: false, error: 'Nincs fájl' });

    const emailTo = req.body?.email || process.env.MAIL_TO_DEFAULT || process.env.SMTP_USER;

    // Demo: nagyon egyszerű "riport" (TXT) tartalom
    const sizeMB = (file.size/1024/1024).toFixed(2);
    const reportText =
`AIRM riport (demo)
Fájlnév: ${file.originalname}
Méret: ${sizeMB} MB
Következtetés: hitelezhető — (demo)
`;

    const txtReportAttachment = {
      filename: 'airm-report.txt',
      content: Buffer.from(reportText, 'utf8')
    };

    const pdfAttachment = {
      filename: file.originalname,
      path: file.path,
      contentType: 'application/pdf'
    };

    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"AIRM feltöltés" <${process.env.SMTP_USER}>`,
      to: emailTo,
      subject: `AIRM – új e-beszámoló (${file.originalname})`,
      text: `Eredmény (demo): hitelezhető\nFájlnév: ${file.originalname} (${sizeMB} MB)`,
      // KÜLDJÜK A TXT riportot is és a PDF-et is:
      attachments: [txtReportAttachment, pdfAttachment]
    });

    // töröljük az ideiglenes fájlt
    try { fs.unlinkSync(file.path); } catch {}

    return res.json({ ok: true, result: 'Email elküldve a riporttal és a PDF-fel.' });
  } catch (e) {
    console.error('Hiba:', e);
    return res.json({ ok: false, error: String(e.message || e) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('AIRM uploader running on', port));
