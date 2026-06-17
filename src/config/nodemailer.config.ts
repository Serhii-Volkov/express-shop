import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
   host: process.env.SMTP_HOST,
   port: 587,
   secure: false, // use false for STARTTLS; true for SSL on port 465
   auth: {
       user: process.env.SMTP_USER,
       pass: process.env.SMTP_PASS
   },
   tls: {
    rejectUnauthorized: false,
  },
});

 export const mailOptions = (to: string, subject: string, text: string) => {
  return {
    from: process.env.SMTP_USER,
    to,
    subject,
    text
  }
  
};

// Отправка письма
//transporter.sendMail(mailOptions(), (error, info) => {
//  if (error) {
//    return console.log('Ошибка при отправке:', error);
//  }
//  console.log('Письмо отправлено:', info.response);
//});
