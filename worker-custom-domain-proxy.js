const MY_DOMAIN = "roshanswain.com"
const START_PAGE = ""
const DISQUS_SHORTNAME = "roshanswain"


addEventListener('fetch', event => {
    event.respondWith(fetchAndApply(event.request))
})

