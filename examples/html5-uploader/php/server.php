<?php

/*
Copyright 2011 OCAD University

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

$temp_dir = "temp/";

/**
 * Return error message with the http status code 403
 * @access public
 * @param  string err_string          the error message
 *         integer return_err_in_html 1/0. Return error message in a complete html 
 */
function return_error($err_string, $return_err_in_html) {
    if ($return_err_in_html) {
    	$error = '<html><p><meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1"/>';
    }
    
    $error .= $err_string;
    
    if ($return_err_in_html) {
    	$error .= '</p></html>';
    }

    header("HTTP/1.1 403 Forbidden", TRUE, 403);
    header('Content-length: '. strlen($error));
    echo $error;
}

// Return error if there is no file received
if (count($_FILES) == 0) {
	return_error("No file was received at the server.", $return_err_in_html);
	exit;
}

foreach ($_FILES as $name => $file_data) {
	$file_name = $file_data['name'];

	// Return error if $temp_dir does not exist
	if (!file_exists($temp_dir)) {
		return_error('The upload folder <span style="font: bold">'.$temp_dir.'</span> does not exist.', $return_err_in_html);
		exit;
	}
	
	$destination = $temp_dir.$file_name;
	
	// Return error if the file has been uploaded
	if (file_exists($destination)) {
		return_error($file_name.' has already been uploaded.', $return_err_in_html);
		exit;
	}
	
	// Copy the uploaded file into the image folder
	move_uploaded_file($file_data['tmp_name'], $destination);
	
	echo '<img src="'.htmlentities($destination).'" alt="'.$file_name.'" />';
}
?>