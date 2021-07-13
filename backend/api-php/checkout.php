<?php

    // var_dump($_POST);

    $post = '';
    
    foreach ($_POST as $key => $value) {
        $post .= "$key: $value\n";
    }

    echo json_encode($post);
    // echo json_encode($key);
    // echo json_encode($_POST);
