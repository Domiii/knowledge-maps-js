<?php
// This file is part of a Moodle plugin.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Code fragment to define the version of Knowledge Maps
 * This fragment is called by moodle_needs_upgrading() and /admin/index.php
 *
 * @package    mod-knowledgemaps
 * @copyright  2013 Dominik Seifert domi@cmlab.csie.ntu.edu.tw
 *
 * @author Dominik Seifert
 * @author ?
 *
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$module->version   = 2013123100;        	// The current module version (Date: YYYYMMDDXX)
$module->requires  = 2013111800;    		// Requires this Moodle version
$module->component = 'mod_knowledgemaps';   // Full name of the plugin (used for diagnostics)
$module->cron      = 0;						// we don't need a cron job
