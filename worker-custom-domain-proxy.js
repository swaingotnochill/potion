// Credits: Taras Frank

const MY_DOMAIN = "roshanswain.com"
const START_PAGE = ""
const DISQUS_SHORTNAME = "roshanswain"


addEventListener('fetch', event => {
    event.respondWith(fetchAndApply(event.request))
})

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, POST,PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

function handleOptions(request) {
  if (request.headers.get("Origin") !== null &&
    request.headers.get("Access-Control-Request-Method") !== null &&
    request.headers.get("Access-Control-Request-Headers") !== null) {
    // Handle CORS pre-flight request.
    return new Response(null, {
      headers: corsHeaders
    })
  } else {
    // Handle standard OPTIONS request.
    return new Response(null, {
      headers: {
        "Allow": "GET, HEAD, POST, PUT, OPTIONS",
      }
    })
  }
}

async function fetchAndApply(request) {
  if (request.method === "OPTIONS") {
    return handleOptions(request)
  }
  let url = new URL(request.url)
  let response
  if (url.pathname.startsWith("/app") && url.pathname.endsWith("js")) {
    // skip validation in app.js
    response = await fetch(`https://www.notion.so${url.pathname}`)
    let body = await response.text()
    try {
      response = new Response(body.replace(/www.notion.so/g, MY_DOMAIN).replace(/notion.so/g, MY_DOMAIN), response)
      response.headers.set('Content-Type', "application/x-javascript")
      console.log("get rewrite app.js")
    } catch (err) {
      console.log(err)
    }

  } else if ((url.pathname.startsWith("/api"))) {
    // Forward API
    response = await fetch(`https://www.notion.so${url.pathname}`, {
      body: request.body, // must match 'Content-Type' header
      headers: {
        'content-type': 'application/json;charset=UTF-8',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36'
      },
      method: "POST", // *GET, POST, PUT, DELETE, etc.
    })
    response = new Response(response.body, response)
    response.headers.set('Access-Control-Allow-Origin', "*")
  } else if (url.pathname === `/`) {
    // 301 redrict
    let pageUrlList = START_PAGE.split("/")
    let redrictUrl = `https://${MY_DOMAIN}/${pageUrlList[pageUrlList.length - 1]}`
    return Response.redirect(redrictUrl, 301)
  } else {
    response = await fetch(`https://www.notion.so${url.pathname}`, {
      body: request.body, // must match 'Content-Type' header
      headers: request.headers,
      method: request.method, // *GET, POST, PUT, DELETE, etc.
    })
    response = new Response(response.body, response)
    if (DISQUS_SHORTNAME) {
      // Delete CSP to load disqus content
      response.headers.delete("Content-Security-Policy")
      // add disqus comment component for every notion page
      return new HTMLRewriter().on('body', new ElementHandler()).transform(response)
    }
  }
  return response
}

class ElementHandler {
  element(element) {
    // An incoming element, such as `div`
    element.append(`
<script>
let disqus = document.createElement("div")
disqus.id = "disqus_thread"
disqus.style.width = "100%"
var disqus_config = function () {
    let pathList = window.location.pathname.split("-")
    let pageID = pathList[pathList.length - 1]
    this.page.url = window.location.href;
    if (/^[\w]{32}$/.test(pageID)) {
      this.page.identifier = pageID;
    }else{
      this.page.identifier = undefined;
    }
};
(function () {
    var d = document, s = d.createElement('script');
    s.src = 'https://${DISQUS_SHORTNAME}.disqus.com/embed.js';
    s.setAttribute('data-timestamp', +new Date());
    (d.head || d.body).appendChild(s);
})();
// if you want to hide some element, add the selector to hideEle Array
const hideEle = [
  "#notion-app > div > div.notion-cursor-listener > div > div:nth-child(1) > div.notion-topbar > div > div:nth-child(6)",
  "#notion-app > div > div.notion-cursor-listener > div > div:nth-child(1) > div.notion-topbar > div > div:nth-child(5)",
  "#notion-app > div > div.notion-cursor-listener > div > div:nth-child(1) > div.notion-topbar > div > div:nth-child(4)",
]
// if you want to replace some element, add the selector and innerHTML to replaceEle Object
const replaceEle = {
  "#notion-app > div > div.notion-cursor-listener > div > div:nth-child(1) > div.notion-topbar > div > div:nth-child(6)": "<span>agodrich<span>"
}
function hideElement(qs) {
  let eles = document.querySelectorAll(qs)
  eles && eles.forEach(ele => ele.style.display = "none")
}
function replaceElement(qs, _html) {
  let ele = document.querySelector(qs)
  if (ele) {
    ele.innerHTML = _html
  }
}
let MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
let body = document.querySelector('body');
let observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
        let pageContent = document.querySelector("#notion-app div.notion-page-content")
        if (pageContent) {
            if (pageContent.lastChild && pageContent.lastChild.id !== "disqus_thread") {
                pageContent.append(disqus)
                DISQUS.reset({ reload: true })
                console.log(+new Date())
            }
        }
        hideEle.forEach( hideE => hideElement(hideE) )
        Object.entries(replaceEle).forEach( item => {
          let [qs,_html] = item;
          replaceEle(qs,_html)
        })
    });
});
observer.observe(body, { subtree: true, childList: true });
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript">comments powered by Disqus.</a></noscript>
`, { html: Boolean })
    console.log(`Incoming element: ${element.tagName}`)
  }

  comments(comment) {
    // An incoming comment
  }

  text(text) {
    // An incoming piece of text
  }
}
