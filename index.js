require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");
const nodemailer = require("nodemailer");
const siteURL = "https://www.fly4free.pl/";

const fetchData = async (URL) => {
  const response = await axios.get(URL);
  return response.data;
};

const loadCheerio = async () => {
  const html = await fetchData(siteURL);
  const loaded = cheerio.load(html);
  return loaded;
};

const parseItems = async () => {
  const items = [];
  const $ = await loadCheerio();

  $(".item__content")
    .map(function (i, el) {
      const href = $(this).children()[0].children[0].attribs.href;
      const text = $(this).children()[0].children[0].children[0].data;
      const when = $(this).children()[1].children[1].next.children[0].data;
      if (text.indexOf("PLN") != -1)
        items.push({
          href,
          text,
          when,
          price: text.split(" PLN")[0].split(" ").reverse()[0],
        });
    })
    .get();

  return items.sort((a, b) =>
    parseInt(a.price) > parseInt(b.price)
      ? 1
      : parseInt(a.price) > parseInt(b.price)
      ? -1
      : 0
  );
};

const itemsToHTML = async () => {
  const items = await parseItems();
  console.log(items);
  const html = `<div><h1>Hejka Lisie!</h1><p>Kilka przydatnych linków:</p>${items.map(
    ({ href, text, when, price }) => {
      return `<div><a href='${href}' target=”_blank”>${text}</a><p>${when}</p><h3>${price}</h3></div>`;
    }
  )}</div>`;
  return html;
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

const mailOptions = async () => {
  return {
    from: process.env.EMAIL,
    to: process.env.EMAILTO,
    subject: process.env.SUBJECT,
    html: await itemsToHTML(),
  };
};

const send = async () => {
  const options = await mailOptions();
  transporter.sendMail(options, (err, data) => {
    err ? console.error(err) : console.log(data);
  });
};

send();
