# Blue Chain Aqua — 3D Sequential Aquaculture Experience

This version keeps the uploaded Blue Chain Aqua site content and the uploaded intro video unchanged, then turns the main homepage into a scroll-driven 3D process experience inspired by the supplied 1000161194.mp4 reference.

## Intro
- `assets/intro-video.mp4` is the uploaded intro video, copied unchanged.
- It remains the first screen before the main website.
- Audible autoplay is attempted; if the browser blocks sound, the visitor gets an "Enter Blue Chain Aqua — Play intro with sound" action.
- Skip intro remains available.

## 3D sequence
The homepage now uses a sticky cinematic scene with 8 scroll stages:
1. Water Selection
2. Pond Preparation
3. Hatchery
4. Grow-out Farming
5. Harvesting
6. Processing & Value Addition
7. Market & Supply Chain
8. Blue Economy

Each stage changes the theme, copy, 3D object and progress indicator. The sequence uses CSS 3D transforms and layered UI rather than replacing the website with a static image.

## Main site
The existing consultancy sections remain after the sequence:
- Opportunity
- Services
- Six-stage consultancy process
- PAN India operations
- Why Blue Chain Aqua
- Contact / CTA

## Run
Use VS Code Live Server or any static web server so local MP4 assets load reliably.


## Real process footage
The eight stage scenes now use real process footage from Pexels, with the previous local MP4s retained as fallbacks. The selected clips cover water testing, excavation/site preparation, a fish hatchery facility, pond aeration, fish harvesting, fish processing, an Indian fish market, and coastal fishing/harvesting. Pexels marks these individual clips as free to use on their pages.

Sources:
- Stage 01: https://www.pexels.com/video/testing-the-quality-of-water-1394221/
- Stage 02: https://www.pexels.com/video/excavator-digging-at-busy-construction-site-34521510/
- Stage 03: https://www.pexels.com/video/aerial-view-of-modern-fish-hatchery-facility-35841152/
- Stage 04: https://www.pexels.com/video/aerial-view-of-fish-pond-aerator-with-circular-design-34450582/
- Stage 05: https://www.pexels.com/video/fishermen-harvesting-the-fish-pond-9019485/
- Stage 06: https://www.pexels.com/video/fish-processing-with-gloved-hands-31801703/
- Stage 07: https://www.pexels.com/video/view-of-a-busy-fish-market-of-india-5564236/
- Stage 08: https://www.pexels.com/video/traditional-fishermen-at-work-on-coastal-boats-28784037/


## Project planning enhancement
- Added a dedicated Project Planning & Readiness section based on the consulting concepts requested from the KissanMitrr reference: assess & validate, business planning, financial clarity, funding readiness and execution support.
- The content is rewritten for aquaculture/fisheries consultancy and does not copy the reference site's branding.
- Added Planning to the navigation and footer, plus Privacy Policy and Terms of Service anchors.


## Security hardening

This deployment includes security headers via `vercel.json`, server-side Groq credentials, server-owned AI prompts/models, request validation, and an 8 MB transcription upload limit. Frontend HTML/CSS/JavaScript cannot be made completely secret: the browser must receive code required to render and run the site. Keep private credentials and business logic on the server and keep the Git repository private if the source must not be publicly accessible.
