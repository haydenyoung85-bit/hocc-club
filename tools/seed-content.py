# One-time seed of content/site.json from the old static pages' facts.
import json, os
I = 'images/'
gallery_nums = """42bc1aed-CS-1 e4d06da4-CS-2 11b3936f-CS-4 eb6d5d34-CS-5 249bb2c6-CS-6 112fd8ff-CS-7 bf904c74-CS-8 d815aacb-CS-9 91def16d-CS-10 6ddcea1e-CS-11 34e38516-CS-12 8e747718-CS-13 c2896d94-CS-14 a513e608-CS-15 1c1faca5-CS-16 29aeaf60-CS-17 fb0eec06-CS-18 21f1ace5-CS-19 2a71b8e5-CS-20 71b3b257-CS-21 9aa3a1dc-CS-22 9502dca8-CS-23 ce13806a-CS-24 4a88973c-CS-25 43e6a2be-CS-26 1ba05a37-CS-27 094b264d-CS-28 a1709c0d-CS-29 69b3c61e-CS-30 f0feaeec-CS-31 aafb63b7-CS-32 80c63f4b-CS-33 18d601bd-CS-34 be3396cb-CS-35 8a7a0487-CS-36 aef90560-CS-37 f66562de-CS-38 4b893009-CS-39 e0833593-CS-40 810afc99-CS-41 ce53e1f7-CS-42 1607d893-CS-43 876c399d-CS-44 98332d52-CS-45 b45b48ad-CS-46 0a8c96e6-CS-47 d1384d50-CS-48 17853696-CS-49 f6df6110-CS-50 d2127643-CS-51 cd2d8cfb-CS-53 f8bba247-CS-54""".split()
gallery = [{"image": I + g + ".jpg", "caption": "", "show": True} for g in gallery_nums if os.path.exists(I + g + ".jpg")]
sp = [("a22579c9-logo.png", "Sponsor", False), ("ec508adc-TCBG_Logo-Address-white.png", "TCBG", True), ("ef33d89c-Sonnys-Cafe.jpg", "Sonny's Café", False), ("9ff5c7dd-Brewer-One-Carpet-png.png", "Brewer Carpet One", False), ("7b7154a2-Yellow-Rose-Dinner-Theater.jpg", "Yellow Rose Dinner Theater", False), ("f989cd9d-Abel-Racing.jpeg", "Abel Racing", False), ("ca9578c1-Punkins-Logo-1.jpg", "Punkins BBQ", False), ("15beaf6d-Knippelmier-Round-Logo-Vector-1.jpg", "Knippelmier Chevrolet, Blanchard, Oklahoma", False), ("8ec5e189-LovesECHOwYELLOW.png", "Love's", False), ("841c75a7-Angel's-Diner-Logo.png", "Angel's Diner", False), ("7eecf29b-Sam-Wampler-Freedom-Ford-Logo.jpg", "Sam Wampler Freedom Ford", False), ("7f888ec8-AAU-Logo.jpg", "AAU", False), ("99fc8521-Komar-Outlet.jpg", "Komar Outlet", False), ("a8b44622-New-inverted-Black-CLOSE-cropped--AEROLARRI-Logo-with-Squares-around.png", "Aero Larri", True), ("174e683a-valley-body-logo-2.0.png", "Valley Body", False), ("199613d2-Legcy-Accounting-CPA,-PLLC.jpg", "Legacy Accounting CPA, PLLC", False)]
classes = [("Class A", "C1 - 53 to 62"), ("Class B", "C2 - 63 to 67"), ("Class C", "C3 - 68 to 82"), ("Class D", "C4 - 84 to 96"), ("Class E", "C5 - 97 to 04 Conv / Coupe"), ("Class F", "C5 - 01 to 04 FRC - Z06"), ("Class G", "C6 - 05 to 13 NB"), ("Class H", "C6 - 06 to 13 WB"), ("Class I", "C7 - 14 to 19 Stingray Coupe/Conv"), ("Class J", "C7 - 17 to 19 Grand Sport Coupe/Conv"), ("Class K", "C7 - 15 to 19 Z06/ZR1 Coupe/Conv"), ("Class L", "C8 - Stingray/Coupe"), ("Class M", "C8 - Stingray/HTC"), ("Class N", "C8 - Z06 / ERay / ZR1 / ZR1X Coupe"), ("Class O", "C8 - Z06 / ERay / ZR1 / ZR1X HTC"), ("Class P", "C1 - C8 Resto / Custom")]
ev = lambda t, s, e, time, place, addr, det="": {"title": t, "start": s, "end": e, "time": time, "place": place, "address": addr, "details": det, "show": True}
data = {
 "settings": {
  "clubName": "Heart of Oklahoma Corvette Club", "shortName": "HOCC",
  "logo": I + "1b97d2c0-HOCC-Logo.png",
  "email": "hoccclub@gmail.com", "phone": "",
  "address": "17118 N. County Rd. 3197\nPauls Valley, OK 73075",
  "facebook": "https://www.facebook.com/groups/1453977328508756",
  "headerButtonText": "2027 Car Show", "headerButtonShort": "Car Show", "headerButtonLink": "car-show.html",
  "footerFine": "Incorporated in Oklahoma as a Not For Profit Corporation on June 12, 2023. 501(c)(3). EIN 93-1833147.",
  "donateLink": "https://www.paypal.com/donate/?hosted_button_id=ZUZLJXYLXD4ZE",
  "helpName": "Hayden", "helpPhone": ""
 },
 "home": {
  "heroEyebrow": "Oklahoma Corvette club · Not-For-Profit · 501(c)(3)",
  "heroTitle": "Corvette people, good company, and a hand for those in need.",
  "heroText": "We are a club of Corvette owners who take part in events and social activities together, and who are willing to support those in need, assist with charitable events and support our local schools and other community activities.",
  "heroImage": I + "42bc1aed-CS-1.jpg",
  "heroButtonText": "Car Show info", "heroButtonLink": "car-show.html",
  "heroButton2Text": "Upcoming events", "heroButton2Link": "events.html",
  "photosTitle": "A few photos",
  "photos": [{"image": I + "91def16d-CS-10.jpg", "caption": ""}, {"image": I + "a513e608-CS-15.jpg", "caption": ""}, {"image": I + "1ba05a37-CS-27.jpg", "caption": ""}, {"image": I + "810afc99-CS-41.jpg", "caption": ""}],
  "joinText": "New to the club? Single membership is $40 and family membership is $50.",
  "givingText": "The club supports Autism Oklahoma and the Sgt. Miles Tarron Foundation of McAlester."
 },
 "about": {
  "purpose": "The purpose of the Heart of Oklahoma Corvette Club (HOCC) is to encourage participation of the club members in events and social activities that promote HOCC and its membership. The members of HOCC are willing to support those in need, assist with charitable events and support our local schools and other community activities.",
  "photo": I + "b98f7c88-1st-club-meeting-4.jpg", "photoCaption": "The first club meeting.",
  "officers": [
   {"name": "Dianne Dunbar", "role": "President", "photo": I + "0f66eeb4-Dianne-2.jpeg", "bio": "Dianne is retired. She is a Veteran of the US Air Force. She has worn many different hats during her career; she is most proud of her work as a private caregiver for the last 15 years. She is thrilled to have found her Corvette family with the Heart of Oklahoma Corvette Club and learning more about her car.", "show": True},
   {"name": "David Finley", "role": "Vice President & Founder", "photo": I + "2134be6e-David-Finley.jpg", "bio": "David currently works for the USDA - NRCS. David’s service is as a Quality Assurance Inspector for the rehabilitation of flood control dams. David’s hobbies include woodworking and diy projects. David enjoys being a part of the Corvette community and hanging out with his Corvette family of friends.", "show": True},
   {"name": "Myra Finley", "role": "Treasurer & Founder", "photo": I + "22e0c5cb-Myra-Finley-v2.jpg", "bio": "Myra has been married to David for 30+ years and is retired. Myra has over 40 years in the accounting industry. Myra enjoys crafts and diy projects. Myra loves her Corvette and Corvette family.", "show": True},
   {"name": "Carolyn Thompson", "role": "Member At Large", "photo": I + "1f68d82e-Carolyn-Thompson.png", "bio": "Carolyn retired from a non-profit after 17 years as a contractor at Tinker Air Force Base. Loves all corvettes but has a special place in her heart for C3’s. Enjoys flowers, woodworking and grandkids.", "show": True}],
  "faqs": [
   {"q": "Where does the club meet?", "a": "Sonny’s Café, 2406 Weeden Blvd, Purcell, OK 73080, (405) 527-0640; and Yellow Rose Dinner Theater, 1005 SW 4th St, Moore, OK 73160. See the events page for dates.", "show": True},
   {"q": "Do I need to be a member to attend events?", "a": "In club sponsored events membership is required.", "show": True},
   {"q": "Is HOCC a non-profit?", "a": "Yes. HOCC is incorporated in the State of Oklahoma as a Not For Profit Corporation. HOCC was incorporated on June 12th, 2023.", "show": True},
   {"q": "Is HOCC a 501(c)(3)?", "a": "Yes. HOCC EIN: 93-1833147", "show": True}]
 },
 "newMembers": {"title": "Welcome, new members", "intro": "", "items": []},
 "events": {
  "intro": "Membership is required for club sponsored events. Past events disappear by themselves.",
  "items": [
   ev("HOCC's Annual Fall Foliage Corvette Cruise Adventure", "2026-10-23", "2026-10-25", "9 am", "Cherokee Casino & Hotel Roland", "109 Cherokee Blvd, Roland, OK 74954"),
   ev("HOCC Board Meeting", "2026-11-03", "", "6:00 pm – 8:00 pm", "Van's Pig Stand", "1991 Tower Dr, Moore, OK 73160"),
   ev("HOCC Ladies Night Out Dinner", "2026-11-04", "", "7:00 pm – 9:00 pm", "BJ's Restaurant & Brewhouse", "330 Ed Noble Pkwy, Norman, OK 73072"),
   ev("Midwest City Veterans Day Parade", "2026-11-11", "", "8:00 am – 3:30 pm", "Midwest City, OK", ""),
   ev("HOCC November Membership Meeting", "2026-11-21", "", "1:00 pm – 3:00 pm", "Yellow Rose Dinner Theater", "1005 SW 4th St, Moore, OK"),
   ev("HOCC Christmas Party", "2026-12-12", "", "5:00 pm – 8:00 pm", "South Lakes Event Center", "4302 SW 119th St, OKC, OK 73173")],
  "meetings": [
   {"name": "Sonny's Café", "address": "2406 Weeden Blvd\nPurcell, OK 73080", "phone": "(405) 527-0640"},
   {"name": "Yellow Rose Dinner Theater", "address": "1005 SW 4th St\nMoore, OK 73160", "phone": ""}]
 },
 "carShow": {
  "label": "Past event · Sold out",
  "title": "2026 Height of Summer Corvette Show",
  "dates": "July 23–26, 2026",
  "venue": "Southeast EXPO Center | 4500 West, 4500 US-270, McAlester, OK 74501",
  "status": "SOLD OUT — Thank You! We’re excited to have a full house for this event!",
  "highlights": "Friday’s Evening Meet & Greet Social\nFriday Fun Day - Planned Events\nSaturday’s Big Corvette Show Event\nShuttle Service Available",
  "details": "Only 140 registration spaces available.\nRain or shine — no refunds.\nTotal classes offered: 16\nFirst through third place awards: 48\nTotal awards, including specialty and members choice: 80+\nRegistration was $50. Show shirts were $27.",
  "image": I + "810e384a-hocc-show-shirt.jpg", "imageCaption": "The show shirt.",
  "openingNote": "",
  "classes": [{"name": a, "desc": b} for a, b in classes],
  "hotels": [
   {"name": "Hampton Inn", "logo": I + "b4a90257-Screen-Shot-2026-02-15-at-12.50.37-PM.png", "rate": "$105.00 + tax / night", "code": "Group Code: HOS", "phone": "(918) 302-3882 opt 0", "notes": "Hotel is providing a water hose for guests", "link": "https://www.hilton.com/en/attend-my-event/heightofsummercorvette/", "qr": I + "1ba8bb97-Hamption-Inn---HOSCorvette_QR.png", "show": True},
   {"name": "Extended Stay America", "logo": I + "8482978a-Screen-Shot-2026-02-15-at-12.45.55-PM.png", "rate": "$88.00 - $99.00 + tax / night", "code": "Group Code: 328329", "phone": "(918) 426-4171", "notes": "", "link": "https://extendedstayamerica.com/corporate?corpcode=328329", "qr": I + "c6e0df42-Screen-Shot-2026-02-15-at-1.03.28-PM.png", "show": True},
   {"name": "Holiday Inn Express & Suites", "logo": I + "18d4020b-Screen-Shot-2026-02-15-at-12.43.32-PM.png", "rate": "$129.00 + tax / night", "code": "Block Code: COR", "phone": "(918) 423-1118", "notes": "", "link": "https://www.ihg.com/redirect?path=rates&brandCode=EX&localeCode=en&regionCode=1&hotelCode=MLCPR&checkInDate=23&checkInMonthYear=062026&checkOutDate=26&checkOutMonthYear=062026&_PMID=99801505&GPC=COR&cn=no&adjustMonth=false&showApp=true&monthIndex=00", "qr": I + "90dac972-holidayinnexpress.png", "show": True}],
  "camper": "RV accommodations at the Expo Center - $25/night\n30 & 50 amp hookups at the site\nWater/Bath House are available for Campers\nNo Dump station available.\nTo reserve call 539-995-0539 / 918-922-0700\nWash Station available at Expo",
  "shuttle": "Hotel Shuttle Transportation Furnished by: Dream City Church (Tips proceeds go to Youth Summer Camp)\nShuttle runs every 20 mins\nThursday: 4pm - 7pm\nFriday: 9am - 7pm\nSaturday: 6am - 10pm",
  "shuttleLink": "https://www.dreamcityok.church/", "shuttleLogo": I + "68b2443b-Screen-Shot-2026-02-15-at-1.13.38-PM.png",
  "qrCodes": [],
  "partners": [
   {"image": I + "e4f16259-logo.png", "name": "Southeast EXPO Center", "link": ""},
   {"image": I + "e9837f93-Untitled-design-10.png", "name": "McAlester OK", "link": ""},
   {"image": I + "7ccca7e6-corvettes.png", "name": "Corvettes", "link": ""}],
  "benefitText": "Show proceeds benefit Autism Oklahoma and the Sgt. Miles Tarron Foundation."
 },
 "registration": {
  "enabled": False, "openDate": "2027-01-01", "cap": 140, "spotsLeft": 140,
  "fee": "50", "feeNote": "", "dinnerPrice": "", "shirtPrice": "", "shirtSizes": "S, M, L, XL, 2XL, 3XL",
  "shirtPopup": True, "shirtImage": I + "810e384a-hocc-show-shirt.jpg",
  "paypalLink": "", "intro": "Fill in the form for each car you are entering. After you send it, you pay with PayPal.",
  "waitlistText": "The show is full. Fill in the form to join the waiting list. We will contact you if a spot opens up.",
  "terms": "Rain or shine — no refunds."
 },
 "apparel": {
  "intro": "Show shirts and club gear.",
  "items": [{"name": "2026 Height of Summer Show Shirt", "image": I + "810e384a-hocc-show-shirt.jpg", "price": "27", "sizes": "S, M, L, XL, 2XL, 3XL", "description": "", "buyLink": "", "show": True}],
  "drtTitle": "DRT Shop", "drtText": "Order club apparel from the DRT online shop.", "drtLink": ""
 },
 "forSale": {
  "intro": "Corvette cars and parts for sale by club members and friends.",
  "listings": [{"title": "C5 Inner Fender Covers", "price": "$120.00/pair", "description": "Shale/Oak Painted Fiberglass Inner Fender Covers. Can be repainted to match other colors. Current paint color will work with 2003 50th Anniversary Special Edition and 2004 Lemans Blue as the color matches interior color of these cars", "photos": [{"image": I + "decd3454-Finleyforsale1.jpg"}, {"image": I + "16921434-image-asset.jpeg"}, {"image": I + "16921435-image-asset.jpeg"}], "contactName": "David Finley", "phone": "405-630-6723", "email": "", "status": "approved", "sold": True}]
 },
 "sponsors": {"intro": "With thanks to the businesses that support the club.", "items": [{"name": n, "logo": I + f, "link": "", "darkBg": d, "show": True} for f, n, d in sp], "trailerPhoto": I + "2db7d26b-1000010066.jpg", "trailerCaption": "The club trailer carries our annual sponsors."},
 "charities": {"intro": "The members of HOCC are willing to support those in need, assist with charitable events and support our local schools and other community activities.", "items": [
   {"name": "Autism Oklahoma", "logo": I + "41d8273c-Autism-Okla.png", "text": "AutismOklahoma had grassroots beginnings in 2002 when families began meeting together to help problem solve family challenges. We create opportunities and engage families to help their own family and a few more. Our programs are FREE or NEARLY FREE and are funded by donations. 95 cents of every dollar donated is used to fund programs in Oklahoma. 501(c)3", "address": "7725 W Reno Ave\nOklahoma City, OK 73127\n(405) 355-2525", "link": "", "show": True},
   {"name": "Sgt. Miles Tarron Foundation", "logo": I + "68ee1f8b-Sgt-Miles-Tarron-Foundation-Logo.png", "text": "The Sergeant Miles Tarron Foundation serves so many in their community of McAlester, OK. It all began when Reed Marcum realized some of his classmates didn’t have some of the basic things they needed for school. He started by filling bags with pencils, erasers and other school supplies. This project grew into filling backpacks with school supplies and giving them away to kids in the community. The next phase began with giving away hats and gloves to those that didn’t have any for the winter. This project grew into the largest community toy giveaway in the McAlester area. To date, they have given away over 70,000 toys and there is no sign of slowing down. The Foundation also has a side that honors Veterans with a Field of Honor that consist of flags (made in the USA) and tags for all the Veterans being honored. There is also a scholarship program for high school seniors that includes writing an essay about “What Veterans Mean to Me”. This amazing Foundation has such a tremendous impact in and around the McAlester community doing so many different things for those in need. These different projects began as simple 4-H ideas that were fueled by the passion of those that saw a need and followed their hearts.", "address": "McAlester, OK", "link": "", "show": True}]},
 "membership": {
  "intro": "Single membership $40. Family membership $50.",
  "singleLabel": "Single", "singlePrice": "40", "familyLabel": "Family", "familyPrice": "50",
  "renewNote": "Renewal invoices will be mailed to each club member the first of December each year.",
  "payNote": "You do not need a PayPal account. You can pay with any credit or debit card.",
  "paypalSingle": "", "paypalFamily": "",
  "checkText": "Download and print the application, then mail it with your check to:",
  "applicationFile": "files/HOCC-Application.docx",
  "photos": [{"image": I + "16905231-image-asset.jpeg"}, {"image": I + "16939796-image-asset.jpeg"}]
 },
 "gallery": {"intro": "Photos from the club car show.", "photos": gallery},
 "contact": {"intro": "We would love to hear from you.", "formOn": True}
}
json.dump(data, open('content/site.json', 'w'), indent=1, ensure_ascii=False)
print(len(gallery), 'gallery photos')
