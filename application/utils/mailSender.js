
const MailSender = {

	'smtpTransport' : require('../../config/mailer') ,
	'urlService' : require('../../config/usefulvars').urlService
}

MailSender.sendMail = (emailto , subject, html, functionErrorResponse) => {
	const mailOptions = {
                        	to: emailto ,
                        	subject : subject ,
                        	html : html
                        }
    MailSender.smtpTransport.sendMail(mailOptions, functionErrorResponse)
}

module.exports = MailSender