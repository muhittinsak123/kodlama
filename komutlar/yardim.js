const Discord = require('discord.js');

exports.run = async (client, message, args) => {
	//kendi URL'lerini eklersn :D
  var embed = new Discord.RichEmbed()
  .setColor('RANDOM')
  .setAuthor("devTR", client.user.avatarURL)
  .addField("Sistemin amacı nedir?", "[devTR](https://discord.gg/jcUAfPU) sunucumuzda altın, elmas, premium ve full rolünüz var ise kodlara ister siteden erişeceksiniz. \n [Web Site](https://devtr-code.glitch.me)")
  message.channel.send({embed: embed})
  
};

exports.conf = {
	enabled: true,
	guildOnly: true,
	aliases: ['ay', 'haelp', 'ha', 'bailgi', 'ianfo'],
	permLevel: 0,
	kategori: 'genel'
}

exports.help = {
	name: 'yardaım',
	description: 'Sistem hakkında bilgi gösterir.',
	usage: 'yardım'
}