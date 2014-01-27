<?

// ######################################################################
// lib.php contains all functions required by the Moodle core
// See: http://docs.moodle.org/dev/NEWMODULE_Documentation#lib.php
// ######################################################################

/**
 * This file defines the main KnowledgeMap configuration form
 *
 * @copyrigth 2014 Dominik Seifert, National Taiwan University
 *
 * @author Dominik Seifert
 *
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
 

require_once("$CFG->dirroot/config.php");

/**
 * This function is called after an editing teacher creates a knowledge map instance.
 * The function is responsible for adding the newly created object to the DB and returning the instance id.
 *
 * @global object
 * @param object $survey
 * @return int|bool
 */
function knowledgemaps_add_instance($newMap) {
    global $DB;
	
	// TODO?
    
    $newMap->timemodified = $newMap->timecreated  = time();

    return $DB->insert_record("knowledgemaps", $newMap);
}

/**
 * This function is called after an editing teacher updates a knowledge map instance.
 * The function is responsible for placing the changes in the DB and returning the instance id.
 *
 * @global object
 * @param object $newMap
 * @return int|bool
 */
function knowledgemaps_update_instance($newMap) {
	global $DB;
	
    $newMap->timemodified = time();
    
    return $DB->update_record("knowledgemaps", $newMap);
}


/**
 * Given an ID of an instance of this module,
 * this function will permanently delete the instance
 * and any data that depends on it.
 *
 * @param int $id Id of the module instance
 * @return boolean Success/Failure
 **/
function knowledge_delete_instance($mapid) {
    global $DB;

    // if (!$map = $DB->get_record("knowledgemaps", array('mapid' => $mapid))) {
        // return false;
    // }
    
    if (!$DB->delete_records("knowledgemaps", array('mapid' => $mapid))) {
        // the given map did not exist
        return false;
    }

    return true;
}


/**
 * TODO
 */
function knowledgemaps_reset_userdata($data) {
    global $CFG,$DB;
    
    
}


/**
 * TODO
 */
function knowledgemaps_reset_course_form_definition(&$mform) {
    // $mform->addElement('header', 'wikiheader', get_string('modulenameplural', 'wiki'));
    // $mform->addElement('advcheckbox', 'reset_knowledgemaps_tags', get_string('removeallwikitags', 'wiki'));
    // $mform->addElement('advcheckbox', 'reset_knowledgemaps_comments', get_string('deleteallcomments'));
}

/**
 * Return a small object with summary information about what a
 * user has done with a given particular instance of this module
 * Used for user activity reports.
 * $return->time = the time they did it
 * $return->info = a short text description
 *
 * @return null
 * @todo Finish documenting this function
 **/
function knowledgemaps_user_outline($course, $user, $mod, $wiki) {
    return null;
}

/**
 * Print a detailed representation of what a user has done with
 * a given particular instance of this module, for user activity reports.
 *
 * @return boolean
 * @todo Finish documenting this function
 **/
function knowledgemaps_user_complete($course, $user, $mod, $wiki) {
    return true;
}

/**
 * Indicates API features that this module supports.
 *
 * @uses FEATURE_GROUPS
 * @uses FEATURE_GROUPINGS
 * @uses FEATURE_GROUPMEMBERSONLY
 * @uses FEATURE_MOD_INTRO
 * @uses FEATURE_COMPLETION_TRACKS_VIEWS
 * @uses FEATURE_COMPLETION_HAS_RULES
 * @uses FEATURE_GRADE_HAS_GRADE
 * @uses FEATURE_GRADE_OUTCOMES
 * @param string $feature
 * @return mixed True if yes (some features may use other values)
 */
function knowledgemaps_supports($feature) {
    // switch ($feature) {
    // case FEATURE_GROUPS:
        // return true;
    // case FEATURE_GROUPINGS:
        // return true;
    // case FEATURE_GROUPMEMBERSONLY:
        // return true;
    // case FEATURE_MOD_INTRO:
        // return true;
    // case FEATURE_COMPLETION_TRACKS_VIEWS:
        // return true;
    // case FEATURE_GRADE_HAS_GRADE:
        // return false;
    // case FEATURE_GRADE_OUTCOMES:
        // return false;
    // case FEATURE_RATE:
        // return false;
    // case FEATURE_BACKUP_MOODLE2:
        // return true;
    // case FEATURE_SHOW_DESCRIPTION:
        // return true;

    // default:
        // return null;
    // }
    return false;
}

/**
 * Given a course and a time, this module should find recent activity
 * that has occurred in wiki activities and print it out.
 * Return true if there was output, or false is there was none.
 *
 * @global $CFG
 * @global $DB
 * @uses CONTEXT_MODULE
 * @uses VISIBLEGROUPS
 * @param object $course
 * @param bool $viewfullnames capability
 * @param int $timestart
 * @return boolean
 **/
function knowledgemaps_print_recent_activity($course, $viewfullnames, $timestart) {
    global $CFG, $DB, $OUTPUT;
    
    //echo $OUTPUT->heading(get_string("updatedwikipages", 'wiki') . ':', 3);
    // foreach ($wikis as $wiki) {
        // $cm = $modinfo->instances['wiki'][$wiki->wikiid];
        // $link = $CFG->wwwroot . '/mod/wiki/view.php?pageid=' . $wiki->id;
        // print_recent_activity_note($wiki->timemodified, $wiki, $cm->name, $link, false, $viewfullnames);
    // }

    return false; //  True if anything was printed, otherwise false
}
/**
 * Function to be run periodically according to the moodle cron
 * This function searches for things that need to be done, such
 * as sending out mail, toggling flags etc ...
 *
 * @uses $CFG
 * @return boolean
 * @todo Finish documenting this function
 **/
function knowledgemaps_cron() {
    global $CFG;

    return true;
}

/**
 * Must return an array of grades for a given instance of this module,
 * indexed by user.  It also returns a maximum allowed grade.
 *
 * Example:
 *    $return->grades = array of grades;
 *    $return->maxgrade = maximum allowed grade;
 *
 *    return $return;
 *
 * @param int $wikiid ID of an instance of this module
 * @return mixed Null or object with an array of grades and with the maximum grade
 **/
function knowledgemaps_grades($wikiid) {
    return null;
}

/**
 * This function returns if a scale is being used by one wiki
 * it it has support for grading and scales. Commented code should be
 * modified if necessary. See forum, glossary or journal modules
 * as reference.
 *
 * @param int $wikiid ID of an instance of this module
 * @return mixed
 * @todo Finish documenting this function
 **/
function knowledgemaps_scale_used($wikiid, $scaleid) {
    $return = false;

    //$rec = get_record("wiki","id","$wikiid","scale","-$scaleid");
    //
    //if (!empty($rec)  && !empty($scaleid)) {
    //    $return = true;
    //}

    return $return;
}

/**
 * Checks if scale is being used by any instance of this module.
 * This function was added in 1.9.
 *
 * @param $scaleid int
 * @return boolean True if the scale is used by any wiki
 */
function knowledgemaps_scale_used_anywhere($scaleid) {
    global $DB;

    return false;
}

/**
 * file serving callback
 *
 * @package  mod_knowledgemaps
 * @category files
 * @param stdClass $course course object
 * @param stdClass $cm course module object
 * @param stdClass $context context object
 * @param string $filearea file area
 * @param array $args extra arguments
 * @param bool $forcedownload whether or not force download
 * @param array $options additional options affecting the file serving
 * @return bool false if the file was not found, just send the file otherwise and do not return anything
 */
function knowledgemaps_pluginfile($course, $cm, $context, $filearea, $args, $forcedownload, array $options=array()) {
    global $CFG;

    return false;
}

function knowledgemaps_search_form($cm, $search = '') {
    global $CFG, $OUTPUT;

    // $output = '<div class="wikisearch">';
    // $output .= '<form method="post" action="' . $CFG->wwwroot . '/mod/wiki/search.php" style="display:inline">';
    // $output .= '<fieldset class="invisiblefieldset">';
    // $output .= '<legend class="accesshide">'. get_string('searchwikis', 'wiki') .'</legend>';
    // $output .= '<label class="accesshide" for="searchwiki">' . get_string("searchterms", "wiki") . '</label>';
    // $output .= '<input id="searchwiki" name="searchstring" type="text" size="18" value="' . s($search, true) . '" alt="search" />';
    // $output .= '<input name="courseid" type="hidden" value="' . $cm->course . '" />';
    // $output .= '<input name="cmid" type="hidden" value="' . $cm->id . '" />';
    // $output .= '<input name="searchwikicontent" type="hidden" value="1" />';
    // $output .= '<input value="' . get_string('searchwikis', 'wiki') . '" type="submit" />';
    // $output .= '</fieldset>';
    // $output .= '</form>';
    // $output .= '</div>';

    return null;
}

function knowledgemaps_extend_navigation(navigation_node $navref, $course, $module, $cm) {
    return false;
}
/**
 * Returns all other caps used in this module
 *
 * @return array
 */
function knowledgemaps_get_extra_capabilities() {
    //return array('moodle/comment:view', 'moodle/comment:post', 'moodle/comment:delete');
    return array();
}

/**
 * Running addtional permission check on plugin, for example, plugins
 * may have switch to turn on/off comments option, this callback will
 * affect UI display, not like pluginname_comment_validate only throw
 * exceptions.
 * Capability check has been done in comment->check_permissions(), we
 * don't need to do it again here.
 *
 * @package  mod_knowledgemaps
 * @category comment
 *
 * @param stdClass $comment_param {
 *              context  => context the context object
 *              courseid => int course id
 *              cm       => stdClass course module object
 *              commentarea => string comment area
 *              itemid      => int itemid
 * }
 * @return array
 */
function knowledgemaps_comment_permissions($comment_param) {
    return array();
}

/**
 * Validate comment parameter before perform other comments actions
 *
 * @param stdClass $comment_param {
 *              context  => context the context object
 *              courseid => int course id
 *              cm       => stdClass course module object
 *              commentarea => string comment area
 *              itemid      => int itemid
 * }
 *
 * @package  mod_knowledgemaps
 * @category comment
 *
 * @return boolean
 */
function knowledgemaps_comment_validate($comment_param) {
    throw new comment_exception('invalidcommentid');
}

/**
 * Return a list of page types
 * @param string $pagetype current page type
 * @param stdClass $parentcontext Block's parent context
 * @param stdClass $currentcontext Current context of block
 */
function knowledgemaps_page_type_list($pagetype, $parentcontext, $currentcontext) {
    return null;
}

?>