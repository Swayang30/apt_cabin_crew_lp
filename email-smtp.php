<?php
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';
require 'PHPMailer/src/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$mail = new PHPMailer(true);

$mail = new PHPMailer();

$MailSubject = 'Email From Email from Applied Professional Training Landing Page Section';

$sender_name = $_POST["name"]; 
$reply_to_email = $_POST["email"];
$phone = $_POST["mobile"];
$age = $_POST["age"];
$qualification     = $_POST["qualification"];
$page = isset($_POST["page"]) ? $_POST["page"] : '';

$data = array(
    'entry.1472419002' => $sender_name,
    'entry.1422423744' => $phone,
    'entry.43600842' => $age,
    'entry.1563985007' => $reply_to_email,
    'entry.258322016' => $qualification
  );
  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, 'https://docs.google.com/forms/d/e/1FAIpQLSdJ754YLG6hQ8qCmE68PfJkCMAK9Xa3JulAfF7AXHcxF6ZgAg/formResponse');
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
  curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
  curl_setopt($ch, CURLOPT_TIMEOUT, 15);
  curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
  curl_setopt($ch, CURLOPT_POST, 1);
  curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
  $response = curl_exec($ch);

$MailHtmlMessage = '<p><strong>Name</strong> : '.$sender_name.
 			'<p><strong>Email</strong> : '.$reply_to_email.
 			'<p><strong>Phone</strong> : '.$phone.
 			'<p><strong>Age</strong> : '.$age.
 			'<p><strong>Qualification</strong> : '.$qualification.
 			'<p><strong>Page Link</strong> : '.$page;
    
$mail->isSMTP();
$mail->Host = "leader.herosite.pro";
$mail->SMTPAuth = true;
$mail->Username = "campaigns@aptadvantage.com";
$mail->Password = "5F@*n[^KY?NN"; 
$mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
$mail->Port       = 587;

$mail->setFrom('campaigns@aptadvantage.com', 'APT Advantage');
$mail->addAddress('campaigns.apt@gmail.com', 'APT Advantage');
$mail->AddCC('plandleadtest@gmail.com', 'APT Advantage');
$mail->addAddress('nilanjana.apt@gmail.com', 'APT Advantage');
$mail->addAddress('murad.apt@gmail.com', 'APT Advantage');

$mail->Subject = $MailSubject;
// Set HTML 
$mail->isHTML(TRUE);
$mail->MsgHTML($MailHtmlMessage); 

// send the message
if(!$mail->send()){
    echo 'Message could not be sent.';
    echo 'Mailer Error: ' . $mail->ErrorInfo;
} else {
    echo "<script type='text/javascript'>
				window.location.href = '/cabin-crew/thank-you/';
			</script>";
} ?>