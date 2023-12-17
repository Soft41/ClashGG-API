import axios from "axios";

export class CaptchaSolver {
  constructor(ruCaptchaApi, siteKey, pageUrl) {
    this.apiKey = ruCaptchaApi;
    this.siteKey = siteKey;
    this.pageUrl = pageUrl;
  }

  async checkBalance() {
    return (
      await axios.get(
        `http://rucaptcha.com/res.php?key=${this.apiKey}&action=getbalance`,
      )
    ).data;
  }

  async reportBad(id) {
    return await axios.get(
      `http://rucaptcha.com/res.php?key=${this.apiKey}&action=reportbad&id=${id}`,
    );
  }
  async reportGood(id) {
    return await axios.get(
      `http://rucaptcha.com/res.php?key=${this.apiKey}&action=reportgood&id=${id}`,
    );
  }

  async solveCaptcha() {
    const res = await axios.post("http://rucaptcha.com/in.php", {
      key: this.apiKey,
      method: "hcaptcha",
      sitekey: this.siteKey,
      pageurl: this.pageUrl,
      json: 1,
    });
    return res.data.request;
  }

  async checkCaptcha(id) {
    const res = await axios.get(
      `http://rucaptcha.com/res.php?key=${this.apiKey}&action=get&id=${id}`,
    );
    if (res.data === "CAPCHA_NOT_READY") return false;
    return res.data.split("|")[1];
  }
}
