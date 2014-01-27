<?

require_once("$CFG->dirroot/mod/knowledgemaps/lib.php");

/**
 * Get the KnowledgeMap instance with the given id.
 * @param int $kmid the instance id of the KM
 */
function km_get_km($kmid) {
    global $DB;

    return $DB->get_record('knowledgemaps', array('id' => $wikiid));
}