<?

require_once('../../config.php');
 
$courseId = required_param('id', PARAM_INT);           // Course ID
 
// Ensure that the course specified is valid
if (!$course = $DB->get_record('course', array('id'=> $courseId))) {
    print_error('Course ID is incorrect');
}

?>