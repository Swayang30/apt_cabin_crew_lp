<?php
if(isset($_POST['submit']))
{
    $to  = "campaigns@aptadvantage.com";
    $subject = "Email From Applied Professional Training Landing Page Section";	
	$message ='<table width="500" border="0" align="center" cellpadding="12" cellspacing="1" bgcolor="#bbbbbb">
	  <tr>
		<td colspan="2" align="left" valign="middle" bgcolor="#000066"><span class="style4" style="color:#fff;">Email From Applied Professional Training Landing Page Section</span></td>
	  </tr>
	  <tr>
		<td width="161" align="left" valign="middle" bgcolor="#eeeeee"><span class="style2">Name</span></td>
		<td width="416" align="left" valign="middle" bgcolor="#eeeeee"><span class="style2">'.$_POST['name'].'</span></td>
	  </tr>
	  <tr>
		<td align="left" valign="middle" bgcolor="#eeeeee"><span class="style2">Email</span></td>
		<td align="left" valign="middle" bgcolor="#eeeeee"><span class="style2">'.$_POST['email'].'</span></td>
	  </tr>
	  <tr>
		<td align="left" valign="middle" bgcolor="#eeeeee"><span class="style2">Mobile Number</span></td>
		<td align="left" valign="middle" bgcolor="#eeeeee"><span class="style2">'.$_POST['mobile'].'</span></td>
	  </tr>
	  <tr>
		<td align="left" valign="middle" bgcolor="#eeeeee"><span class="style2">Age</span></td>
		<td align="left" valign="middle" bgcolor="#eeeeee"><span class="style2">'.$_POST['age'].'</span></td>
	  </tr>
	  <tr>
		<td align="left" valign="middle" bgcolor="#eeeeee"><span class="style2">Qualification</span></td>
		<td align="left" valign="middle" bgcolor="#eeeeee"><span class="style2">'.$_POST['qualification'].'</span></td>
	  </tr>
	  <tr>
		<td align="left" valign="middle" bgcolor="#eeeeee"><span class="style2">privacy</span></td>
		<td align="left" valign="middle" bgcolor="#eeeeee"><span class="style2">'.$_POST['privacy'].'</span></td>
	  </tr></table>';
    $headers  = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type: text/html; charset=iso-8859-1" . "\r\n";
    $headers .= "From: APT Advantage <noreply@aptadvantage.com>" . "\r\n";
    if(mail($to, $subject, $message, $headers))
    {
        echo "<script>window.location.href='../courses-thank-you'</script>";
    }
    else
    {
        echo "<script>alert('Error!! Please contact Admin.')</script>";
    }
} ?>