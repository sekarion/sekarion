/**
 * MONGOOSE VERSION
 * @author Joris Dugué
 * @link https://sekarion.tk
 * @licence http://www.gnu.org/licenses/gpl.txt GNU GPL v3
 * @copyright Copyright (c) 2019 Joris Dugué
 **/
document.addEventListener("DOMContentLoaded",function(){
    document.addEventListener("click", function (b) {
        let a = "show";
        if(b.target.matches(".navbar-toggler")){
            let c = document.querySelector(".collapse.navbar-collapse");
            if(c.classList) {
                c.classList.toggle(a);
            }else{
                let b=c.className.split(" "),
                    d=b.indexOf(a);0<=d?b.splice(d,1):b.push(a);
                    c.className=b.join(" ")}}
    });
});
/**
 * Conditions avec fonction pour cacher l'element #sesssion
 * @param  document.querySelector('#session') selection la div avec la l'id session
 */
// if () {
// 	function header() {
// 		document.querySelector('#flash').classList.add('hidden');
// 	}
// 	setTimeout(header,5000)
// }


window.onload = flashAlert();
/**
 * Fonction pour multi element flash
 */

function flashAlert() {
    var allerts = document.querySelectorAll('#flash');

    for (var i = 0; i <= allerts.length; i++) {
        if (allerts[i]) {
            allerts[i].style.top =  70 + ( 50 * i ) + 'px';
        }
    }
}

/**
 * Fonction pour cacher chaque element flash aux bout de 5s
 */
function header() {
    var allerts = document.querySelectorAll('#flash');
    for (var i = 0; i <= allerts.length; i++) {
        if (allerts[i]) {
            allerts[i].classList.add('hidden');
        }
    }
}

if (document.querySelector('#flash')) {
    setTimeout(header,5000)
}