import nodemailer from "nodemailer"

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "antonpaper500@gmail.com",
        pass: "zlzs gpfv wkhb eejs",
      },
    })
  }

  async sendActivationMail(to, link) {
    await this.transporter.sendMail({
      from: "antonpaper500@gmail.com",
      to,
      subject: "Активация аккаунта на " + "http://localhost:4000",
      text: "cssa",
      html:
        `
        <div>
            <h1>Активация аккаунта по ссылке</h1>
            <a href="${link}">${link}</a>
        </div>
      `,
    })
  }
}

export const mailService = new MailService()