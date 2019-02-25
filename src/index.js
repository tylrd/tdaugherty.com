import "./css/main.css"

import hljs from 'highlight.js/lib/highlight'
import 'highlight.js/styles/github.css'

import javascript from 'highlight.js/lib/languages/javascript'
import ruby from 'highlight.js/lib/languages/ruby'
import bash from 'highlight.js/lib/languages/bash'

// import { icon } from '@fortawesome/fontawesome-svg-core'
// import { faGithub } from "@fortawesome/free-brands-svg-icons/faGithub"
// import { faLinkedinIn } from "@fortawesome/free-brands-svg-icons/faLinkedinIn"

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('ruby', ruby);
hljs.initHighlightingOnLoad()

// icon(faGithub)
// icon(faLinkedinIn)
