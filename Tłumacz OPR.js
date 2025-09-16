// ==UserScript==
// @name         Tłumacz OPR
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  Automatycznie podmienia opisy zdolności na stronie Army Forge OPR, używając zewnętrznego pliku.
// @author       22
// @match        *://army-forge.onepagerules.com/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    const jsonUrl = 'https://raw.githubusercontent.com/Kolodny22/opr-pl/refs/heads/main/tlumaczenia.json';

    function replaceTextInNode(node, replacements) {
        if (node.nodeType === Node.TEXT_NODE) {
            let text = node.nodeValue;
            let hasChanged = false;

            // Krok 1: Podmień całe opisy (dokładne dopasowanie tekstu)
            for (const originalDescription in replacements.descriptions) {
                if (text.includes(originalDescription)) {
                    text = text.replace(originalDescription, replacements.descriptions[originalDescription]);
                    hasChanged = true;
                }
            }

            // Krok 2: Podmień pojedyncze słowa (z granicami słów)
            for (const originalWord in replacements.words) {
                const regex = new RegExp(`\\b${originalWord}\\b`, 'gi');
                if (regex.test(text)) {
                    text = text.replace(regex, replacements.words[originalWord]);
                    hasChanged = true;
                }
            }

            if (hasChanged) {
                node.nodeValue = text;
            }
        }
    }

    function traverseAndReplace(element, replacements) {
        element.querySelectorAll('*').forEach(child => {
            child.childNodes.forEach(node => replaceTextInNode(node, replacements));
        });
    }

    GM_xmlhttpRequest({
        method: "GET",
        url: jsonUrl,
        onload: function(response) {
            try {
                const replacements = JSON.parse(response.responseText);

                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'childList' || mutation.type === 'characterData') {
                            const element = mutation.target.nodeType === Node.TEXT_NODE ? mutation.target.parentNode : mutation.target;
                            if (element) {
                                traverseAndReplace(element, replacements);
                            }
                        }
                    });
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    characterData: true
                });

                setTimeout(() => {
                    traverseAndReplace(document.body, replacements);
                }, 2000);

            } catch (e) {
                console.error("Błąd podczas parsowania JSON:", e);
            }
        },
        onerror: function(response) {
            console.error("Błąd pobierania pliku JSON. Status:", response.status);
        }
    });

})();
