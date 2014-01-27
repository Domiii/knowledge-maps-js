<?

require_once('../../config.php');
require_once('lib.php');

$cmid = required_param('id', PARAM_INT);
$cm = get_coursemodule_from_id('knowledgemaps', $cmid, 0, false, MUST_EXIST);
$course = get_course($cm->course);
 
require_login($course, true, $cm);
$PAGE->set_url('/mod/knowledgemaps/view.php', array('id' => $cm->id));
$PAGE->set_title(get_string('title', 'knowledgemaps', $course->fullname));
$PAGE->set_heading('Hello there!');

?>