const request = require('request');
const db = require('quick.db');
const fs = require('fs');

const url = require("url");
const path = require("path");

const Discord = require("discord.js");

var express = require('express');
var app = express();
const moment = require("moment");
require("moment-duration-format");

const passport = require("passport");
const session = require("express-session");
const LevelStore = require("level-session-store")(session);
const Strategy = require("passport-discord").Strategy;

const helmet = require("helmet");

const md = require("marked");



module.exports = (client) => {

const templateDir = path.resolve(`${process.cwd()}${path.sep}html`);

app.use("/css", express.static(path.resolve(`${templateDir}${path.sep}css`)));

passport.serializeUser((user, done) => {
done(null, user);
});
passport.deserializeUser((obj, done) => {
done(null, obj);
});

passport.use(new Strategy({
clientID: client.user.id,
clientSecret: client.ayarlar.oauthSecret,
callbackURL: client.ayarlar.callbackURL,
scope: ["identify"]
},
(accessToken, refreshToken, profile, done) => {
process.nextTick(() => done(null, profile));
}));

app.use(session({
secret: 'aKcVbK_HL09k0erK2-WfQoj4k1lKdF4J',
resave: false,
saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(helmet());

app.locals.domain = process.env.PROJECT_DOMAIN;

app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");

var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ 
extended: true
})); 

function checkAuth(req, res, next) {
if (req.isAuthenticated()) return next();
req.session.backURL = req.url;
res.redirect("/giris");
}

const renderTemplate = (res, req, template, data = {}) => {
const baseData = {
bot: client,
path: req.path,
user: req.isAuthenticated() ? req.user : null
};
res.render(path.resolve(`${templateDir}${path.sep}${template}`), Object.assign(baseData, data));
};

app.get("/giris", (req, res, next) => {
if (req.session.backURL) {
req.session.backURL = req.session.backURL;
} else if (req.headers.referer) {
const parsed = url.parse(req.headers.referer);
if (parsed.hostname === app.locals.domain) {
req.session.backURL = parsed.path;
}
} else {
req.session.backURL = "/";
}
next();
},
passport.authenticate("discord"));

app.get("/baglanti-hatası", (req, res) => {
renderTemplate(res, req, "autherror.ejs");
});
 
  
app.get("/callback", passport.authenticate("discord", { failureRedirect: "/" }), async (req, res) => {
if (req.session.backURL) {
  
const url = req.session.backURL;
req.session.backURL = null;
res.redirect(url);
} else {
  client.channels.get("688832795434549304").send(req.user.username + " sisteme giriş yaptı. 📥")
   //client.channels.get("688832795434549304").send(req.user.username + req.user.id + " sisteme giriş yaptı. 📥")

res.redirect("/");
}
});

app.get("/cikis", async function(req, res) {
 await client.channels.get("688832795434549304").send(req.user.username + " sistemden çıkış yaptı. 📤")

req.session.destroy(() => {
req.logout();
res.redirect("/");
});
});

app.get("/", (req, res) => {
renderTemplate(res, req, "index.ejs");
});
  
  app.get("/alim", (req, res) => { renderTemplate (res, req, "alim.ejs") });



app.get("/terms", (req, res) => {
  
renderTemplate(res, req, "terms.ejs");
});

app.get("/kullanici/:userID/sil/:botID", checkAuth, (req, res) => {
  var id = req.params.botID
  renderTemplate(res, req, "sil.ejs", {id}) 
});

app.post("/kullanici/:userID/sil/:botID", checkAuth, (req, res) => {

let ID = req.params.botID

db.delete(`botlar.${ID}`) 
db.delete(`kbotlar.${req.user.id}.${ID}`)

res.redirect("/kullanici/"+req.params.userID);
});
app.get("/botlar", (req, res) => {
 
renderTemplate(res, req, "botlar.ejs")
});

app.get("/Ekibimiz", (req, res) => {
 
renderTemplate(res, req, "ekibimiz.ejs")
});
    
app.get("/nasil", (req, res) => {
 
renderTemplate(res, req, "nasıl.ejs")
});
  

  
app.get("/botyonetim/hata", (req, res) => {
  
renderTemplate(res, req, "hataa.ejs")
});
  
app.get("/komut/:botID/rapor", checkAuth, (req, res) => {

renderTemplate (res, req, "rapor.ejs");
});

app.post("/komut/:botID/rapor", checkAuth, (req, res) => {

let ayar = req.body

if(ayar['mesaj-1']) {
db.push(`botlar.${req.params.botID}.raporlar`, JSON.parse(`{ "rapor":"${ayar['mesaj-1']}" }`))
app.get("/komut/:botID", checkAuth, (req, res) => {

renderTemplate (res, req, "başarılı.ejs");
});
client.channels.get('689066360269176833').send(`:warning: **YENİ RAPOR GELDİ!** \n   :incoming_envelope: **Raporlayan**: \`${req.user.username}#${req.user.discriminator}\`\n   :notepad_spiral: **İçerik**: \`${db.fetch(`botlar.${req.params.botID}.prefix`)}\` \n   :pencil: **Sebep**: \`${ayar['mesaj-1']}\``)
}
if(ayar['mesaj-2']) {
db.push(`botlar.${req.params.botID}.raporlar`, JSON.parse(`{ "rapor":"${ayar['mesaj-2']}" }`))
client.channels.get('689066360269176833').send(`:warning: **YENİ RAPOR GELİD!** \n   :incoming_envelope: **Raporlayan**: \`${req.user.username}#${req.user.discriminator}\`\n   :notepad_spiral: **İçerik**: \`${db.fetch(`botlar.${req.params.botID}.prefix`)}\` \n   :pencil: **Sebep**: \`${ayar['mesaj-2']}\``)
}

res.redirect('/komut/'+req.params.botID);
});


app.get("/komut/:botID/yorum", checkAuth, (req, res) => {

renderTemplate (res, req, "yorum.ejs");
});  

app.post("/komut/:botID/yorum", checkAuth, (req, res) => {

let ayar = req.body

if (ayar === {}  || !ayar['yorum-1'] || !ayar['yorum-2']) return res.redirect('/botyonetim/hata')
 {
db.push(`botlar.${req.params.botID}.raporlar`, JSON.parse(`{ "rapor":"${ayar['yorum-2','yorum-1']}" }`))
client.channels.get('689452095572934703').send(`:bell:  **Yorum Yapıldı** \n:incoming_envelope: **Yorum Yapan**: \`${req.user.username}#${req.user.discriminator}\`\n:notepad_spiral: **Komut İsmi**: \`${db.fetch(`botlar.${req.params.botID}.prefix`)}\` \n**Yıldız**: ${ayar['yorum-1']}\n**Yorum**: \`${ayar['yorum-2']}\``)
}
res.redirect('/yorum/'+req.params.botID);
});

app.get("/yorum/:botID", checkAuth, (req, res) => {

renderTemplate (res, req, "başarılı2.ejs");
});



app.get("/deneme", (req, res) => {
  
renderTemplate(res, req, "deneme.ejs")
});

app.get("/hakkimizda", (req, res) => {
  
renderTemplate(res, req, "hakkımızda.ejs");
});

app.get("/botlar", (req, res) => {
 
renderTemplate(res, req, "botlar.ejs")
});

app.get("/elmas", checkAuth, (req, res) => {
  //if(!client.elmas.includes(req.user.id) ) return res.redirect('/yetkili/hata')
if(!client.guilds.get("653619019571527681").members.get(req.user.id).roles.has("690647576235606027")) return res.send("Altyapı rolün yok rolü alda gel.")
client.channels.get('689080226827075688').send(`:bust_in_silhouette: \`${req.user.username}#${req.user.discriminator}\` Adlı Kişi \`Altyapı\` Adlı Kategoriye Girdi `) // kategori log
renderTemplate(res, req, "elmas.ejs") 
});

app.get("/altin", checkAuth, (req, res) => {
 //if(!client.altin.includes(req.user.id) ) return res.redirect('/yetkili/hata')
if(!client.guilds.get("653619019571527681").members.get(req.user.id).roles.has("689794694448021608")) return res.send("JS+ rolün yok rolü alda gel.")
client.channels.get('689080226827075688').send(`:bust_in_silhouette: \`${req.user.username}#${req.user.discriminator}\` Adlı Kişi \`JS+\` Adlı Kategoriye Girdi `) // kategori log
renderTemplate(res, req, "altin.ejs") 
});

app.get("/premium", checkAuth, (req, res) => {
  //if(!client.premium.includes(req.user.id) ) return res.redirect('/yetkili/hata')
if(!client.guilds.get("653619019571527681").members.get(req.user.id).roles.has("689794755806101516")) return res.send("Premium rolün yok rolü alda gel.")
client.channels.get('689080226827075688').send(`:bust_in_silhouette: \`${req.user.username}#${req.user.discriminator}\` Adlı Kişi \`Premium\` Adlı Kategoriye Girdi `) // kategori log
renderTemplate(res, req, "premium.ejs") 
});

app.get("/full", checkAuth, (req, res) => {
  //if(!client.full.includes(req.user.id) ) return res.redirect('/yetkili/hata')
if(!client.guilds.get("653619019571527681").members.get(req.user.id).roles.has("689794785392984121")) return res.send("Full rolün yok rolü alda gel.")
client.channels.get('').send(`:bust_in_silhouette: \`${req.user.username}#${req.user.discriminator}\` Adlı Kişi \`Full\` Adlı Kategoriye Girdi `) // kategori log
renderTemplate(res, req, "full.ejs") 
});

app.get("/booster", checkAuth, (req, res) => {
  //if(!client.booster.includes(req.user.id) ) return res.redirect('/yetkili/hata')
if(!client.guilds.get("653619019571527681").members.get(req.user.id).roles.has("664857495327735820")) return res.send("Booster rolün yok rolü alda gel.")
client.channels.get('689080226827075688').send(`:bust_in_silhouette: \`${req.user.username}#${req.user.discriminator}\` Adlı Kişi \`Booster\` Adlı Kategoriye Girdi `) // kategori log
renderTemplate(res, req, "booster.ejs") 
});
  
  //app.get("/booster", checkAuth, (req, res) => {
  //if(!client.booster.includes(req.user.id) ) return res.redirect('/yetkili/hata')
//if(!client.guilds.get("653619019571527681").members.get(req.user.id).roles.has("664857495327735820")) return res.send("Booster rolün yok rolü alda gel.")
//client.channels.get('689080226827075688').send(`:bust_in_silhouette: \`${req.user.username}#${req.user.discriminator}\` Adlı Kişi \`Booster\` Adlı Kategoriye Girdi `) // kategori log
//renderTemplate(res, req, "booster.ejs") 
//});
  



app.get("/botekle/hata", (req, res) => {
 
renderTemplate(res, req, "hataaa.ejs")
});

app.get("/botekle", checkAuth, (req, res) => {
  if(!client.yetkililer.includes(req.user.id) ) return res.redirect('/yetkili/hata')
renderTemplate(res, req, "botekle.ejs") 
});

app.get("/deneme", checkAuth, (req, res) => {
 
renderTemplate(res, req, "deneme.ejs")
});

app.post("/botekle", checkAuth, (req, res) => {

let ayar = req.body

if (ayar === {}  || !ayar['botprefix'] || !ayar['kutuphane'] || !ayar['kisa-aciklama'] || !ayar['etikett']) return res.redirect('/botyonetim/hata')

let ID = ayar['botid']

if (db.has('botlar')) {
}
  
  var tag = ''
  if (Array.isArray(ayar['etikett']) === true) {
    var tag = ayar['etikett']
  } else {
    var tag = new Array(ayar['etikett'])
  }

request({
url: `https://discordapp.com/api/v7/users/${req.user.id}`,
headers: {
"Authorization": `Bot ${process.env.TOKEN}`
},
}, function(error, response, body) {
if (error) return console.log(error)
else if (!error) {
var sahip = JSON.parse(body)

db.set(`botlar.${ID}.botid`, ayar['botid'])
db.set(`botlar.${ID}.prefix`, ayar['botprefix'])
db.set(`botlar.${ID}.kutuphane`, ayar['kutuphane'])
db.set(`botlar.${ID}.sahip`, sahip.username+"#"+sahip.discriminator)
db.set(`botlar.${ID}.sahipid`, sahip.id)
db.set(`botlar.${ID}.kisaaciklama`, ayar['kisa-aciklama'])
db.set(`botlar.${ID}.etiket`, tag)
if (ayar['botsite']) {
db.set(`botlar.${ID}.site`, ayar['botsite'])
}
if (ayar['github']) {
db.set(`botlar.${ID}.github`, ayar['github'])
}
if (ayar['instagram']) {
db.set(`botlar.${ID}.instagram`, ayar['instagram'])
}
if (ayar['botdestek']) {
db.set(`botlar.${ID}.destek`, ayar['botdestek'])
}

db.set(`kbotlar.${req.user.id}.${ID}`, db.fetch(`botlar.${ID}`))


res.redirect("/")

}})

});

app.get("/kullanicilar", (req, res) => {
  renderTemplate(res, req, "kullanicilar.ejs")
});

app.get("/kullanici/:userID", (req, res) => {

  request({
    url: `https://discordapp.com/api/v7/users/${req.params.userID}`,
    headers: {
      "Authorization": `Bot ${process.env.TOKEN}`
    },
  }, function(error, response, body) {
    if (error) return console.log(error)
    else if (!error) {
      var kisi = JSON.parse(body)

      renderTemplate(res, req, "kullanici.ejs", {kisi})
    };
  });

});

app.get("/kullanici/:userID/profil", (req, res) => {

  request({
    url: `https://discordapp.com/api/v7/users/${req.params.userID}`,
    headers: {
      "Authorization": `Bot ${process.env.TOKEN}`
    },
  }, function(error, response, body) {
    if (error) return console.log(error)
    else if (!error) {
      var kisi = JSON.parse(body)

      renderTemplate(res, req, "profil.ejs", {kisi})
    };
  });

});

app.get("/kullanici/:userID/profil/ayarla", checkAuth, (req, res) => {

  renderTemplate(res, req, "p-ayarla.ejs")

});

app.post("/kullanici/:userID/profil/ayarla", checkAuth, (req, res) => {

  if (req.params.userID !== req.user.id) return res.redirect('/');

  var profil = JSON.parse(fs.readFileSync('./profil.json', 'utf8'));

  var libs = ''
  if (Array.isArray(req.body['libs']) === true) {
    var libs = req.body['libs']
  } else {
    var libs = new Array(req.body['libs'])
  }

  request({
    url: `https://discordapp.com/api/v7/users/${req.params.userID}`,
    headers: {
      "Authorization": `Bot ${process.env.TOKEN}`
    },
  }, function(error, response, body) {
    if (error) return console.log(error)
    else if (!error) {
      var kisi = JSON.parse(body)

  var veri = JSON.parse(`{
  "tag": "${kisi.username}#${kisi.discriminator}",
  "isim": "${req.body['isim']}",
  "yas": "${req.body['yas']}",
  "biyo": "${req.body['biyo']}",
  "favlib": "${req.body['favlib']}",
  "libs": "${libs}",
  "avatar": "https://cdn.discordapp.com/avatars/${kisi.id}/${kisi.avatar}.png"
  }`)

  profil[req.user.id] = veri;

  var obj = JSON.stringify(profil)

  fs.writeFile('./profil.json', obj)

  res.redirect('/kullanici/'+req.user.id)

    }
  })

});

app.get("/kullanici/:userID/panel", checkAuth, (req, res) => {

renderTemplate(res, req, "panel.ejs")

});

app.get("/kullanici/:userID/duzenle/:botID/", checkAuth, (req, res) => {


var id = req.params.botID


renderTemplate(res, req, "duzenle.ejs", {id})

});


app.post("/kullanici/:userID/duzenle/:botID/", checkAuth, (req, res) => {

let ayar = req.body
let ID = req.params.botID
let s = req.user.id

var tag = ''
  if (Array.isArray(ayar['etikett']) === true) {
    var tag = ayar['etikett']
  } else {
    var tag = new Array(ayar['etikett'])
  }

request({
url: `https://discordapp.com/api/v7/users/${ID}`,
headers: {
"Authorization": `Bot ${process.env.TOKEN}`
},
}, function(error, response, body) {
if (error) return console.log(error)
else if (!error) {
var sistem = JSON.parse(body)

db.set(`botlar.${ID}.isim`, sistem.username+"#"+sistem.discriminator)

db.set(`botlar.${ID}.avatar`, `https://cdn.discordapp.com/avatars/${sistem.id}/${sistem.avatar}.png`)

request({
url: `https://discordapp.com/api/v7/users/${req.user.id}`,
headers: {
"Authorization": `Bot ${process.env.TOKEN}`
},
}, function(error, response, body) {
if (error) return console.log(error)
else if (!error) {
var sahip = JSON.parse(body)
db.set(`botlar.${ID}.prefix`, ayar['botprefix'])
db.set(`botlar.${ID}.kutuphane`, ayar['kutuphane'])
db.set(`botlar.${ID}.sahip`, sahip.username+"#"+sahip.discriminator)
db.set(`botlar.${ID}.sahipid`, sahip.id)
db.set(`botlar.${ID}.kisaaciklama`, ayar['kisa-aciklama'])
db.set(`botlar.${ID}.uzunaciklama`, ayar['uzun-aciklama'])
db.set(`botlar.${ID}.etiket`, tag)
if (ayar['botsite']) {
db.set(`botlar.${ID}.site`, ayar['botsite'])
}
if (ayar['github']) {
db.set(`botlar.${ID}.github`, ayar['github'])
}
if (ayar['instagram']) {
db.set(`botlar.${ID}.instagram`, ayar['instagram'])
}
if (ayar['botdestek']) {
db.set(`botlar.${ID}.destek`, ayar['botdestek'])
}

res.redirect("/kullanici/"+req.params.userID+"/panel");



}})
}})

});

app.get("/kullanici/:userID/panel/:botID/sil", checkAuth, (req, res) => {
  var id = req.params.botID
  renderTemplate(res, req, "sil.ejs", {id}) 
});

app.post("/kullanici/:userID/panel/:botID/sil", checkAuth, (req, res) => {

let ID = req.params.botID

db.delete(`botlar.${ID}`) 
db.delete(`kbotlar.${req.user.id}.${ID}`)

res.redirect("/kullanici/"+req.params.userID+"/panel");
});

app.get("/bot/:botID", (req, res) => {
var id = req.params.botID

request({
url: `https://discordapp.com/api/v7/users/${id}`,
headers: {
"Authorization": `Bot ${process.env.TOKEN}`
},
}, function(error, response, body) {
if (error) return console.log(error)
else if (!error) {
var sistem = JSON.parse(body)

if (db.fetch(`${id}.avatar`) !== `https://cdn.discordapp.com/avatars/${sistem.id}/${sistem.avatar}.png`) {
db.set(`${id}.avatar`, `https://cdn.discordapp.com/avatars/${sistem.id}/${sistem.avatar}.png`)
}

}
})

renderTemplate(res, req, 'bot.ejs', {id})

});

app.get("/bot/:botID/hata", (req, res) => {
renderTemplate(res, req, "hata.ejs")
});

app.get("/bot/:botID/oyver", checkAuth, (req, res) => {

var id = req.params.botID
let user = req.user.id

var saat = `${new Date().getHours() + 3}:${new Date().getMinutes()}:${new Date().getSeconds()}`

if (db.has(`oylar.${id}.${user}`) === true) {
  if (db.fetch(`oylar.${id}.${user}`) !== saat) {
    res.redirect('/bot/'+req.params.botID+'/hata')
    return
  } else if (db.fetch(`oylar.${id}.${user}`) === saat) {
  db.add(`botlar.${id}.oy`, 1)
  db.set(`oylar.${id}.${user}`, saat)
  }
} else {
  db.add(`botlar.${id}.oy`, 1)
  db.set(`oylar.${id}.${user}`, saat)
}

res.redirect('/bot/'+req.params.botID)

});
  
  app.get("/yetkili/hata", (req, res) => {renderTemplate(res, req, "hate.ejs")})

app.get("/yetkili", checkAuth, (req, res) => {
  if(!client.yetkililer.includes(req.user.id) ) return res.redirect('/yetkili/hata')
renderTemplate(res, req, "y-panel.ejs") 
});

app.get("/botyonetici/onayla/:botID", checkAuth, (req, res) => {
  if(!client.yetkililer.includes(req.user.id) ) return res.redirect('/yetkili/hata')
let id = req.params.botID

db.set(`botlar.${id}.durum`, 'Onaylı')

res.redirect("/yetkili")


});

app.get("/botyonetici/altin/:botID", checkAuth, (req, res) => {
  if(!client.yetkililer.includes(req.user.id) ) return res.redirect('/yetkili/hata')
let id = req.params.botID

db.set(`botlar.${id}.durum`, 'Altin')

res.redirect("/yetkili")
client.channels.get(client.ayarlar.kayıt).send(`:bookmark_tabs: **YENİ KOMUT EKLENDİ!** \n :boom: **Ekleyen**: \`${db.fetch(`botlar.${id}.sahip`)}\` \n :label: **Kategori**:\`Altın\`  \n :mag_right: **İçerik**:\`${db.fetch(`botlar.${id}.prefix`)}\` `)


});

app.get("/botyonetici/elmas/:botID", checkAuth, (req, res) => {
  if(!client.yetkililer.includes(req.user.id) ) return res.redirect('/yetkili/hata')
let id = req.params.botID

db.set(`botlar.${id}.durum`, 'Elmas')

res.redirect("/yetkili")
client.channels.get(client.ayarlar.kayıt).send(`:bookmark_tabs: **YENİ KOMUT EKLENDİ!** \n :boom: **Ekleyen**: \`${db.fetch(`botlar.${id}.sahip`)}\` \n :label: **Kategori**:\`Elmas\`  \n :mag_right: **İçerik**:\`${db.fetch(`botlar.${id}.prefix`)}\` `)
  


});

app.get("/botyonetici/premium/:botID", checkAuth, (req, res) => {
  if(!client.yetkililer.includes(req.user.id) ) return res.redirect('/yetkili/hata')
let id = req.params.botID

db.set(`botlar.${id}.durum`, 'Premium')

res.redirect("/yetkili")
client.channels.get(client.ayarlar.kayıt).send(`:bookmark_tabs: **YENİ KOMUT EKLENDİ!** \n :boom: **Ekleyen**: \`${db.fetch(`botlar.${id}.sahip`)}\` \n :label: **Kategori**:\`Premium\`  \n :mag_right: **İçerik**:\`${db.fetch(`botlar.${id}.prefix`)}\` `)
 


});

app.get("/botyonetici/full/:botID", checkAuth, (req, res) => {
  if(!client.yetkililer.includes(req.user.id) ) return res.redirect('/yetkili/hata')
let id = req.params.botID

db.set(`botlar.${id}.durum`, 'Full')

res.redirect("/yetkili")
client.channels.get(client.ayarlar.kayıt).send(`:bookmark_tabs: **YENİ KOMUT EKLENDİ!** \n :boom: **Ekleyen**: \`${db.fetch(`botlar.${id}.sahip`)}\` \n :label: **Kategori**:\`Full\`  \n :mag_right: **İçerik**:\`${db.fetch(`botlar.${id}.prefix`)}\` `)


});

app.get("/botyonetici/booster/:botID", checkAuth, (req, res) => {
  if(!client.yetkililer.includes(req.user.id) ) return res.redirect('/yetkili/hata')
let id = req.params.botID

db.set(`botlar.${id}.durum`, 'Booster')

res.redirect("/yetkili")
client.channels.get(client.ayarlar.kayıt).send(`:bookmark_tabs: **YENİ KOMUT EKLENDİ!** \n :boom: **Ekleyen**: \`${db.fetch(`botlar.${id}.sahip`)}\` \n :label: **Kategori**:\`Booster\`  \n :mag_right: **İçerik**:\`${db.fetch(`botlar.${id}.prefix`)}\` `)


});

app.get("/botyonetici/bekleme/:botID", checkAuth, (req, res) => {
  if(!client.yetkililer.includes(req.user.id) ) return res.redirect('/yetkili/hata')
let id = req.params.botID

db.set(`botlar.${id}.durum`, 'Beklemede')

res.redirect("/yetkili")



});

app.get("/botyonetici/reddet/:botID", checkAuth, (req, res) => {
  if(!client.yetkililer.includes(req.user.id) ) return res.redirect('/yetkili/hata')
  renderTemplate(res, req, "reddet.ejs")
});

app.post("/botyonetici/reddet/:botID", checkAuth, (req, res) => {
  if(!client.yetkililer.includes(req.user.id) ) return res.redirect('/yetkili/hata')
  let id = req.params.botID
  
  res.redirect("/yetkili")
  

  
  db.delete(`botlar.${id}`) 
  db.delete(`kbotlar.${req.user.id}.${id}`)
  
  });

//API
  
app.get("/api", (req, res) => {
  renderTemplate(res, req, "api.ejs")
});

app.get("/api/botlar", (req, res) => {
  res.json({
    hata: 'Bir bot ID yazınız.'
  });
});

app.get("/api/botlar/:botID/oylar", (req, res) => {
  res.json({
    hata: 'Bir kullanıcı ID yazınız.'
  });
});

app.get("/api/botlar/:botID", (req, res) => {
   var id = req.params.botID

   if (db.has('botlar')) {
      if (Object.keys(db.fetch('botlar')).includes(id) === false) {
     res.json({
       hata: 'Yazdığınız ID\'e sahip bir bot sistemde bulunmuyor.'
     });
   }
  }

    res.json({
       isim: db.fetch(`botlar.${id}.isim`),
       id: id,
avatar: db.fetch(`botlar.${id}.avatar`),
prefix: db.fetch(`botlar.${id}.prefix`),
kütüphane: db.fetch(`botlar.${id}.Ayarlanabilir`),
kütüphane: db.fetch(`botlar.${id}.kutuphane`),
sahip: db.fetch(`botlar.${id}.sahip`),
sahipid: db.fetch(`botlar.${id}.sahipid`),
kisa_aciklama: db.fetch(`botlar.${id}.kisaaciklama`),
uzun_aciklama: db.fetch(`botlar.${id}.uzunaciklama`),
etiketler: db.fetch(`botlar.${id}.etiket`),
destek_sunucusu: db.fetch(`botlar.${id}.destek`) || 'Belirtilmemiş',
web_sitesi: db.fetch(`botlar.${id}.site`) || 'Belirtilmemiş',
github: db.fetch(`botlar.${id}.github`) || 'Belirtilmemiş',
instagram: db.fetch(`botlar.${id}.instagram`) || 'Belirtilmemiş',
durum: db.has(`botlar.${id}.durum`) ? db.fetch(`botlar.${id}.durum`) : 'Beklemede',
oy_sayisi: db.fetch(`botlar.${id}.oy`) || 0,
altin: db.fetch(`botlar.${id}.altin`) || 'Bulunmuyor',
elmas: db.fetch(`botlar.${id}.elmas`) || 'Bulunmuyor',
premium: db.fetch(`botlar.${id}.premium`) || 'Bulunmuyor',
full: db.fetch(`botlar.${id}.full`) || 'Bulunmuyor',
booster: db.fetch(`botlar.${id}.booster`) || 'Bulunmuyor'
    });
});

  app.get("/api/tumbotlar", (req, res) => {
    res.json(Object.keys(db.fetch('botlar')));
  });
  
app.get("/api/botlar/:botID/oylar/:kullaniciID", (req, res) => {
  var id = req.params.botID
  var userr = req.params.kullaniciID

  if (db.has('botlar')) {
      if (Object.keys(db.fetch('botlar')).includes(id) === false) {
     res.json({
       hata: 'Yazdığınız ID\'e sahip bir bot sistemde bulunmuyor.'
     });
   }
  }
 
   res.json({
     oy_durum: db.has(`oylar.${id}.${userr}`) ? `Bugün oy vermiş.` : null,
     oy_sayisi: db.fetch(`botlar.${id}.oy`) || 0
   });

});

app.listen(3000);

//Blog

};








//<%- include('ek/header', {bot, user, path}) %>
//<div class="container">
	//<div class="jumbotron">
		//<div align="center">
        //<h3 style="color:#fff">Hm, sanırım daha sunucuda bile yoksun! Lütfen, katıl! ()</h3>
   // </div>
//</div>
//</div></div></div>

////üst kısım html/hatea1.ejs 


//app kısmı
// app.get("/bağlancak yer", checkAuth, (req, res) => {
//renderTemplate(res, req, "hatea1.ejs")
//});
 // app.get("/free", checkAuth, (req, res) => {
//if(!client.guilds.get("id").members.get(req.user.id)) return res.redirect("/sunucuhata");
//renderTemplate(res, req, "free.ejs") 
