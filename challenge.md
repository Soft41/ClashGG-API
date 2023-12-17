1. Берем токен капчи, допустим это token
2. делаем магию раз
```js
const r = token.substr(5, 15);
const n = r.split("").reduce((e, r) => e + r.charCodeAt(0), 0);
const i = r.replace(/[a-zA-Z]/g, (e) =>
    String.fromCharCode(
        (e <= "Z" ? 90 : 122) >= (e = e.charCodeAt(0) + 13) ? e : e - 26,
    ),
);
```
3. формируем c01, c02
```js
const e = Date.now()
const initTs = Date.now() - 10000
const c01 = ~~(Math.sqrt(e) % 1 * 1e9)
const c02 = [n, i].join(",");
 ```
4. Формируем сверхсекретный обьект
```js
const n_to_encrypt = {
  ver: 1,
  its: initTs, //initTs
  cts: Date.now(), // r = 1691416739530
  tim: Date.now - initTs, //я хз че тут было, вроде Date.now- иниттс
  uag: "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36", //useragent
  brw: "sel:0,key:0,wda:0,wdb:1",
  ran: Math.random(),
  c01: c01, // ~~(Math.sqrt(e) % 1 * 1e9) где е = cts == Date.now
  c02: c02,
  dif: Date.now() - initTs, //бля и тут такое же, хуй знает
};

```
5. хуякк-хуяк функшнс
```js
const resultStrRaw = Object.entries(n_to_encrypt)
  .map((e) => {
    let [t, r] = e;
    return t + "=" + r;
  })
  .join(";");

const res = resultStrRaw.replace(/[a-zA-Z]/g, (e) =>
    String.fromCharCode(
        (e <= "Z" ? 90 : 122) >= (e = e.charCodeAt(0) + 13) ? e : e - 26,
    ),
);

const encoded = btoa(res);
const ebaniyrot = (encoded.substring(30) + encoded.substring(0, 30)).replaceAll(
    "=",
    "",
);

ebaniyrot - наша переменная
```