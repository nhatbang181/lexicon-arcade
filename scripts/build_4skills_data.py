#!/usr/bin/env python3
"""
Build public/data/ielts_4skills.json from Anki sub-decks combined with
curated Cambridge IELTS 8.0 academic content, matching src/types/fourSkills.ts.
"""

import html
import json
import os
import re
import shutil
import sqlite3
import tempfile
from datetime import datetime, timezone

ANKI_DB_PATH = os.path.expandvars(r"%APPDATA%\Anki2\Người dùng 1\collection.anki2")
OUT_JSON_PATH = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "public", "data", "ielts_4skills.json")
)

CJK_RE = re.compile(r"[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]")


def clean_html(raw: str) -> str:
    if not raw:
        return ""
    text = re.sub(r"<\s*br\s*/?>", " ", raw, flags=re.IGNORECASE)
    text = re.sub(r"</\s*div\s*>", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def strip_cloze(text: str) -> tuple[str, list[str]]:
    chunks: list[str] = []

    def _repl(match: re.Match) -> str:
        val = match.group(1).strip()
        chunks.append(val)
        return val

    plain = re.sub(r"\{\{c\d+::([^:}]+)(?:::[^}]+)?\}\}", _repl, text)
    return re.sub(r"\s+", " ", plain).strip(), chunks


def load_anki_subdecks() -> dict[str, list[dict]]:
    """Copy collection.anki2 to a temp file, extract target sub-decks using unicase collation, then delete temp file."""
    result: dict[str, list[dict]] = {}
    if not os.path.exists(ANKI_DB_PATH):
        print(f"[WARN] Anki DB not found at {ANKI_DB_PATH}; proceeding with built-in dataset.")
        return result

    fd, tmp_path = tempfile.mkstemp(suffix=".anki2")
    os.close(fd)
    try:
        shutil.copy2(ANKI_DB_PATH, tmp_path)
        conn = sqlite3.connect(tmp_path)
        conn.create_collation(
            "unicase",
            lambda a, b: (a.lower() > b.lower()) - (a.lower() < b.lower()),
        )
        cur = conn.cursor()
        cur.execute("SELECT id, name FROM decks")
        decks = {row[0]: row[1].replace("\x1f", " > ") for row in cur.fetchall()}

        cur.execute("SELECT id, name FROM notetypes")
        notetypes = {row[0]: row[1] for row in cur.fetchall()}

        cur.execute(
            """
            SELECT DISTINCT n.id, c.did, n.mid, n.flds, n.tags
            FROM cards c
            JOIN notes n ON c.nid = n.id
            ORDER BY n.id
            """
        )
        target_keys = [
            "2. Collocation",
            "3. Paraphrase",
            "4. Speaking",
            "5. Writing",
            "8. Bài báo học thuật",
            "9. Listening",
        ]
        for nid, did, mid, flds, tags in cur.fetchall():
            dname = decks.get(did, "")
            if any(k in dname for k in target_keys):
                result.setdefault(dname, []).append(
                    {
                        "nid": nid,
                        "notetype": notetypes.get(mid, ""),
                        "fields": [clean_html(f) for f in flds.split("\x1f")],
                        "tags": tags.strip(),
                    }
                )
        conn.close()
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    return result


# ==============================================================================
# SECTION 1: LISTENING (>= 150 items across 4 categories)
# ==============================================================================

ANKI_LISTENING_ENRICHMENT: dict[str, tuple[str, str, str, str, list[str]]] = {
    # word -> (ipa, category, audioText, commonMistake, distractors)
    "Wednesday": ("/ˈwenzdeɪ/", "number_date", "The university orientation tour has been rescheduled for Wednesday morning at nine.", "Wensday", ["Wensday", "Wednsday", "Wenesday"]),
    "Thursday": ("/ˈθɜːzdeɪ/", "number_date", "Please submit your laboratory safety form before Thursday afternoon.", "Thusday", ["Thusday", "Thirsday", "Thurstday"]),
    "February": ("/ˈfebruəri/", "number_date", "Applications for the spring exchange programme close on the fourteenth of February.", "Febuary", ["Febuary", "Febrary", "Feburary"]),
    "accommodation": ("/əˌkɒməˈdeɪʃn/", "spelling_trap", "International students are guaranteed university accommodation during their first year.", "accomodation", ["accomodation", "acommodation", "acomodation"]),
    "questionnaire": ("/ˌkwestʃəˈneə(r)/", "spelling_trap", "Participants were asked to complete a brief questionnaire after the workshop.", "questionaire", ["questionaire", "questionnare", "questonnaire"]),
    "assignment": ("/əˈsaɪnmənt/", "spelling_trap", "Remember to include a bibliography at the end of your written assignment.", "asignment", ["asignment", "assinment", "assignement"]),
    "tutorial": ("/tjuːˈtɔːriəl/", "spelling_trap", "Each undergraduate attends one small-group tutorial per week with their advisor.", "turtorial", ["turtorial", "tutoral", "tutoriel"]),
    "seminar": ("/ˈsemɪnɑː(r)/", "spelling_trap", "The economics department is hosting a guest seminar on sustainable finance.", "seminer", ["seminer", "seminor", "saminar"]),
    "semester": ("/sɪˈmestə(r)/", "spelling_trap", "Course registration for the autumn semester opens on the first Monday of August.", "simister", ["simister", "semestre", "semaster"]),
    "library": ("/ˈlaɪbrəri/", "spelling_trap", "Quiet study booths on the third floor of the library can be booked online.", "libary", ["libary", "librery", "liberry"]),
    "dissertation": ("/ˌdɪsəˈteɪʃn/", "section4_academic", "Final-year students must submit a ten-thousand-word dissertation in May.", "disertation", ["disertation", "dissertaion", "dissertasion"]),
    "bibliography": ("/ˌbɪbliˈɒɡrəfi/", "section4_academic", "Marks will be deducted if your bibliography does not follow Harvard formatting.", "bibliografy", ["bibliografy", "biblography", "bibliograhpy"]),
    "timetable": ("/ˈtaɪmteɪbl/", "spelling_trap", "An updated lecture timetable has been posted on the student portal.", "time table", ["time table", "timtable", "time-tabel"]),
    "enrolment": ("/ɪnˈrəʊlmənt/", "spelling_trap", "Proof of identity is required at the desk to finalise your enrolment.", "enrolement", ["enrolement", "inrolment", "enrolmant"]),
    "government": ("/ˈɡʌvənmənt/", "spelling_trap", "The regional government has allocated additional funding to coastal flood defences.", "goverment", ["goverment", "governmant", "govornment"]),
    "museum": ("/mjuˈziːəm/", "spelling_trap", "Entry to the natural history museum is free for all local residents on Sundays.", "musuem", ["musuem", "museam", "meseum"]),
    "cathedral": ("/kəˈθiːdrəl/", "spelling_trap", "Guided walking tours depart every hour from the steps of the old cathedral.", "catherdal", ["catherdal", "cathedrel", "cathedrall"]),
    "harbour": ("/ˈhɑːbə(r)/", "spelling_trap", "Ferries to the outer islands leave regularly from the main harbour.", "habour", ["habour", "harborr", "harber"]),
    "theatre": ("/ˈθɪətə(r)/", "spelling_trap", "The renovated civic theatre now seats more than eight hundred audience members.", "thetre", ["thetre", "thearter", "theatere"]),
    "centre": ("/ˈsentə(r)/", "spelling_trap", "The new sports centre features an Olympic-sized swimming pool and climbing wall.", "sentre", ["sentre", "centere", "cintre"]),
    "opposite": ("/ˈɒpəzɪt/", "spelling_trap", "You will find the bicycle rental kiosk directly opposite the train station.", "oposite", ["oposite", "oppositte", "oppersite"]),
    "roundabout": ("/ˈraʊndəbaʊt/", "spelling_trap", "Take the second exit at the roundabout to reach the botanical gardens.", "round about", ["round about", "roundaboat", "rondabout"]),
    "parliament": ("/ˈpɑːləmənt/", "spelling_trap", "Members of parliament will debate the clean energy bill later this month.", "parlament", ["parlament", "parliment", "parliamant"]),
    "restaurant": ("/ˈrestrɒnt/", "spelling_trap", "The riverside restaurant serves locally sourced seafood and vegetarian dishes.", "restaraunt", ["restaraunt", "resturant", "resteraunt"]),
    "pharmacy": ("/ˈfɑːməsi/", "spelling_trap", "There is a late-night pharmacy located next to the campus medical clinic.", "farmacy", ["farmacy", "pharmasy", "phermacy"]),
    "reservation": ("/ˌrezəˈveɪʃn/", "spelling_trap", "Could you please confirm the reference number for your hotel reservation?", "reservaton", ["reservaton", "resavation", "rezervation"]),
    "receipt": ("/rɪˈsiːt/", "spelling_trap", "Please retain your original receipt in case you need to exchange the item.", "reciept", ["reciept", "receit", "receipe"]),
    "deposit": ("/dɪˈpɒzɪt/", "spelling_trap", "Tenants are required to pay a refundable security deposit before moving in.", "deposite", ["deposite", "diposit", "depposit"]),
    "refund": ("/ˈriːfʌnd/", "spelling_trap", "A full refund is available if you cancel your booking at least forty-eight hours ahead.", "refound", ["refound", "reffund", "refand"]),
    "discount": ("/ˈdɪskaʊnt/", "spelling_trap", "Full-time students receive a fifteen percent discount on annual rail passes.", "disscount", ["disscount", "discaunt", "dicount"]),
    "insurance": ("/ɪnˈʃɔːrəns/", "spelling_trap", "Comprehensive travel insurance is mandatory for everyone joining the field trip.", "insurence", ["insurence", "ensurance", "insurrance"]),
    "licence": ("/ˈlaɪsns/", "spelling_trap", "Drivers must present a valid driving licence before collecting the rental car.", "lisence", ["lisence", "licensce", "liscence"]),
    "souvenir": ("/ˌsuːvəˈnɪə(r)/", "spelling_trap", "Visitors can pick up maps and a handmade souvenir at the gallery gift shop.", "sovenir", ["sovenir", "souvenier", "suvenir"]),
    "brochure": ("/ˈbrəʊʃə(r)/", "spelling_trap", "Further details about excursion prices are listed inside the welcome brochure.", "broshure", ["broshure", "brochur", "browsure"]),
    "itinerary": ("/aɪˈtɪnərəri/", "spelling_trap", "Our tour coordinator will email the final itinerary two weeks before departure.", "itinery", ["itinery", "itinarary", "itenary"]),
    "luggage": ("/ˈlʌɡɪdʒ/", "spelling_trap", "Passengers may store heavy luggage in the lockers near platform four.", "lugage", ["lugage", "luggages", "laggage"]),
    "cancelled": ("/ˈkænsld/", "spelling_trap", "Owing to severe coastal winds, the afternoon ferry crossing has been cancelled.", "cancled", ["cancled", "canceleed", "canselled"]),
    "travelling": ("/ˈtrævəlɪŋ/", "spelling_trap", "Many commuters prefer travelling by tram to avoid peak-hour congestion.", "traveling", ["traveiling", "travlling", "travellng"]),
    "vegetarian": ("/ˌvedʒəˈteəriən/", "spelling_trap", "Please notify the catering manager if you require a vegetarian meal option.", "vegeterian", ["vegeterian", "vegatarian", "vegetarean"]),
    "dietary": ("/ˈdaɪətəri/", "spelling_trap", "Delegates should list any special dietary requirements on the registration form.", "dietry", ["dietry", "diatary", "dietery"]),
    "temperature": ("/ˈtemprətʃə(r)/", "spelling_trap", "The greenhouse maintains a constant temperature of twenty-two degrees Celsius.", "temprature", ["temprature", "temperture", "tempereture"]),
    "allergy": ("/ˈælədʒi/", "spelling_trap", "Make sure to inform the nurse if your child has a severe peanut allergy.", "alergy", ["alergy", "allergie", "allargy"]),
    "appointment": ("/əˈpɔɪntmənt/", "spelling_trap", "You can reschedule your dental appointment through the clinic reception desk.", "apointment", ["apointment", "appointmant", "appoinment"]),
    "occupation": ("/ˌɒkjuˈpeɪʃn/", "spelling_trap", "The census form asks respondents to state their current occupation and industry.", "ocupation", ["ocupation", "ocuppation", "occupasion"]),
    "nationality": ("/ˌnæʃəˈnæləti/", "spelling_trap", "Applicants must enter their full name, date of birth, and nationality.", "nationalty", ["nationalty", "nacionality", "nationallity"]),
    "surname": ("/ˈsɜːneɪm/", "spelling_trap", "Could you spell your surname slowly so I can verify your membership record?", "sirname", ["sirname", "surnam", "sur-name"]),
    "colleague": ("/ˈkɒliːɡ/", "spelling_trap", "I am attending the architecture symposium with a senior colleague from Sydney.", "coleague", ["coleague", "colleage", "collegue"]),
    "receptionist": ("/rɪˈsepʃənɪst/", "spelling_trap", "Please collect your visitor badge from the receptionist in the main lobby.", "recepsionist", ["recepsionist", "recieptionist", "receptionest"]),
    "pensioner": ("/ˈpenʃənə(r)/", "spelling_trap", "Concession tickets are offered to any pensioner presenting a senior card.", "pentioner", ["pentioner", "pensoner", "penshioner"]),
    "necessary": ("/ˈnesəsəri/", "spelling_trap", "Protective goggles are necessary whenever you operate machinery in the workshop.", "neccessary", ["neccessary", "necesary", "neccesary"]),
    "convenient": ("/kənˈviːniənt/", "spelling_trap", "The new shuttle bus provides a convenient link between the campus and airport.", "convienient", ["convienient", "conveniant", "convinient"]),
    "equipment": ("/ɪˈkwɪpmənt/", "spelling_trap", "All climbing equipment is inspected weekly by certified safety instructors.", "equipments", ["equipments", "equiptment", "equipmant"]),
    "recommend": ("/ˌrekəˈmend/", "spelling_trap", "The librarian can recommend several peer-reviewed journals for your topic.", "reccomend", ["reccomend", "recomend", "recommmend"]),
    "beginner": ("/bɪˈɡɪnə(r)/", "spelling_trap", "This evening pottery class is specifically tailored for an absolute beginner.", "beginer", ["beginer", "biginner", "beginnar"]),
    "intermediate": ("/ˌɪntəˈmiːdiət/", "spelling_trap", "Students who pass the placement test will enter the intermediate German group.", "intermidiate", ["intermidiate", "intermedate", "intemediate"]),
    "separate": ("/ˈseprət/", "spelling_trap", "Hazardous batteries must be placed in a separate recycling container.", "seperate", ["seperate", "seperete", "seprate"]),
    "definitely": ("/ˈdefɪnətli/", "spelling_trap", "We will definitely need extra volunteers for Saturday's charity marathon.", "definately", ["definately", "definetely", "definitly"]),
    "programme": ("/ˈprəʊɡræm/", "spelling_trap", "The mentorship programme pairs new graduates with experienced industry leaders.", "programe", ["programe", "programmee", "proggramme"]),
    "colour": ("/ˈkʌlə(r)/", "spelling_trap", "In British academic spelling, words like colour and behaviour retain the letter u.", "colur", ["colur", "coloure", "coulor"]),
    "kilometre": ("/kɪˈlɒmɪtə(r)/", "spelling_trap", "The coastal cycling trail stretches for more than forty kilometre markers along the bay.", "killometre", ["killometre", "kilometere", "kilomatere"]),
    "rectangular": ("/rekˈtæŋɡjələ(r)/", "spelling_trap", "Excavations revealed the stone foundations of a large rectangular courtyard.", "rectanglar", ["rectanglar", "rectengular", "rectanguler"]),
}

EXTRA_LISTENING_ITEMS: list[tuple[str, str, str, str, str, str, str, list[str]]] = [
    # (word, ipa, category, audioText, meaningVi, trapExplanationVi, commonMistake, distractors)
    # --- number_date (28 items) ---
    ("thirteen", "/ˌθɜːˈtiːn/", "number_date", "The archaeology museum is open to school groups for thirteen days this month.", "mười ba (13)", "Phân biệt -teen (nhấn âm cuối, nguyên âm dài /iː/) với thirty (nhấn âm đầu).", "thirty", ["thirty", "three", "thirty-three"]),
    ("thirty", "/ˈθɜːti/", "number_date", "Participants must arrive at least thirty minutes prior to the listening exam.", "ba mươi (30)", "Nhấn âm đầu THIR-ty, âm cuối ngắn /i/, khác với thir-TEEN.", "thirteen", ["thirteen", "three", "thirty-one"]),
    ("fourteen", "/ˌfɔːˈtiːn/", "number_date", "The marine survey collected water samples from fourteen coastal monitoring stations.", "mười bốn (14)", "Có chữ u trong fourteen (khác forty không có u) và nhấn âm cuối.", "forty", ["forty", "forteen", "four"]),
    ("forty", "/ˈfɔːti/", "number_date", "The refurbished auditorium can now accommodate forty additional researchers.", "bốn mươi (40)", "Viết forty (KHÔNG có chữ u như four/fourteen); nhấn âm đầu.", "fourty", ["fourty", "fourteen", "fourth"]),
    ("fifteen", "/ˌfɪfˈtiːn/", "number_date", "A late fee of fifteen pounds applies if library books are returned overdue.", "mười lăm (15)", "Nghe kỹ âm /n/ cuối và trọng âm rơi vào -TEEN để không nhầm với fifty.", "fifty", ["fifty", "five", "fiftieth"]),
    ("fifty", "/ˈfɪfti/", "number_date", "Approximately fifty percent of respondents commuted by public transport.", "năm mươi (50)", "Trọng âm ở FIF-ty, không có âm mũi /n/ ở cuối như fifteen.", "fifteen", ["fifteen", "five", "fifteenth"]),
    ("sixteen", "/ˌsɪksˈtiːn/", "number_date", "The exhibition runs for sixteen weeks in the north wing of the gallery.", "mười sáu (16)", "Trọng âm rơi vào âm tiết thứ hai -TEEN; dễ nhầm với sixty khi nói nhanh.", "sixty", ["sixty", "sixth", "six"]),
    ("sixty", "/ˈsɪksti/", "number_date", "The coach journey from the campus to the nature reserve takes sixty minutes.", "sáu mươi (60)", "Nhấn âm đầu SIX-ty, âm cuối /ti/ gọn hơn so với six-TEEN.", "sixteen", ["sixteen", "sixth", "sixty-six"]),
    ("seventeen", "/ˌsevnˈtiːn/", "number_date", "Volunteers planted seventeen native oak saplings along the river embankment.", "mười bảy (17)", "Nhấn mạnh âm cuối -TEEN và kéo dài âm /iː/.", "seventy", ["seventy", "seventh", "seven"]),
    ("seventy", "/ˈsevnti/", "number_date", "Over seventy volunteers signed up to monitor migratory birds this winter.", "bảy mươi (70)", "Nhấn âm đầu SEV-en-ty; chú ý tốc độ đọc nhanh trong IELTS Section 1.", "seventeen", ["seventeen", "seven", "seventeenth"]),
    ("eighteen", "/ˌeɪˈtiːn/", "number_date", "Applicants must be at least eighteen years old to join the overseas fieldwork.", "mười tám (18)", "Chỉ có 1 chữ t (eight + een -> eighteen), nhấn mạnh âm cuối.", "eighty", ["eighty", "eightteen", "eighth"]),
    ("eighty", "/ˈeɪti/", "number_date", "The research vessel sailed eighty nautical miles off the western coast.", "tám mươi (80)", "Nhấn âm đầu EIGH-ty; dễ nhầm với eighteen trong âm thanh nối.", "eighteen", ["eighteen", "eight", "eightieth"]),
    ("nineteen", "/ˌnaɪnˈtiːn/", "number_date", "The botanical survey catalogued nineteen rare orchid species in the valley.", "mười chín (19)", "Giữ chữ e sau nine (nine + teen), nhấn âm cuối -TEEN.", "ninety", ["ninety", "ninteen", "ninth"]),
    ("ninety", "/ˈnaɪnti/", "number_date", "Nearly ninety percent of the survey cohort completed the follow-up interview.", "chín mươi (90)", "Giữ chữ e (ninety, không viết ninty); phân biệt với nineteen.", "nineteen", ["nineteen", "ninty", "ninth"]),
    ("twelfth", "/twelfθ/", "number_date", "The scholarship deadline has been extended to the twelfth of October.", "ngày mười hai / thứ 12", "Biến đổi ve -> f trước th: twelfth (không viết twelveth hoặc twelth).", "twelth", ["twelth", "twelveth", "twenty-second"]),
    ("twentieth", "/ˈtwentiəθ/", "number_date", "Major architectural reforms reshaped European cities during the twentieth century.", "thứ hai mươi (20th)", "Đổi y thành ie rồi thêm th: twent-ie-th (không viết twentyth).", "twentyth", ["twentyth", "twentith", "twelfth"]),
    ("fortieth", "/ˈfɔːtiəθ/", "number_date", "The theatre is celebrating its fortieth anniversary with a special festival.", "thứ bốn mươi (40th)", "Không có chữ u (fortieth, không phải fourtieth).", "fourtieth", ["fourtieth", "fortyeth", "fourteenth"]),
    ("nineteenth", "/ˌnaɪnˈtiːnθ/", "number_date", "Steam railways expanded rapidly throughout the nineteenth century.", "thứ mười chín (19th)", "Giữ e trong nineteen trước khi thêm th.", "ninteenth", ["ninteenth", "ninetieth", "ninth"]),
    ("quarter past", "/ˈkwɔːtə pɑːst/", "number_date", "The guided audio tour starts promptly at quarter past ten each morning.", "hơn mười lăm phút (15 phút sau giờ chẵn)", "Quarter past ten = 10:15, khác hoàn toàn với quarter to ten (9:45).", "quarter to", ["quarter to", "half past", "twenty past"]),
    ("quarter to", "/ˈkwɔːtə tuː/", "number_date", "Please assemble outside the main gate at quarter to eight for the bus.", "kém mười lăm phút (15 phút trước giờ chẵn)", "Quarter to eight = 7:45; bẫy rất phổ biến ở Section 1.", "quarter past", ["quarter past", "half past", "ten to"]),
    ("fortnight", "/ˈfɔːtnaɪt/", "number_date", "Library loans for postgraduate students last for a fortnight and can be renewed.", "hai tuần (14 ngày)", "Từ Anh-Anh chỉ 2 tuần (fourteen nights); hay bị nghe nhầm thành four nights.", "four nights", ["four nights", "forty nights", "four weeks"]),
    ("Tuesday", "/ˈtjuːzdeɪ/", "number_date", "The swimming pool closes early for maintenance every Tuesday evening.", "thứ Ba", "Dễ nghe nhầm với Thursday khi người nói phát âm nhanh âm đầu.", "Thursday", ["Thursday", "Tusday", "Tuseday"]),
    ("January", "/ˈdʒænjuəri/", "number_date", "Tuition invoices for the winter term are issued in early January.", "tháng Một", "Viết đủ u-a-r-y (Jan-u-ary), tránh viết thiếu chữ u.", "Janurary", ["Janurary", "Janary", "Jenuary"]),
    ("August", "/ˈɔːɡəst/", "number_date", "Fieldwork in the northern highlands takes place throughout August.", "tháng Tám", "Chú ý cụm au- đầu từ; tránh nhầm với October trong âm nối.", "Agust", ["Agust", "Augast", "Ogust"]),
    ("September", "/sepˈtembə(r)/", "number_date", "All incoming first-year students must register by the third of September.", "tháng Chín", "Viết đầy đủ Sep-tem-ber, không viết tắt Sept trong bài thi nghe.", "Semptember", ["Semptember", "Septembar", "Setember"]),
    ("November", "/nəʊˈvembə(r)/", "number_date", "The annual film festival returns to the civic hall in mid-November.", "tháng Mười Một", "Phân biệt rõ với September và December khi nghe số tháng.", "Novembar", ["Novembar", "Noveber", "Nowember"]),
    ("midnight", "/ˈmɪdnaɪt/", "number_date", "Online essay submissions must be uploaded to the portal before midnight.", "nửa đêm (00:00)", "Viết liền một từ; bẫy nghe nhầm với midday (12:00 trưa).", "midday", ["midday", "mid-night", "midnite"]),
    ("decade", "/ˈdekeɪd/", "number_date", "Solar energy costs fell by more than eighty percent over the past decade.", "thập kỷ (10 năm)", "Decade = 10 năm; bẫy đánh lừa với century (100 năm) hoặc fortnight (2 tuần).", "century", ["century", "decate", "deccade"]),

    # --- minimal_pair (34 items) ---
    ("desert", "/ˈdezət/", "minimal_pair", "Satellite imagery shows that the desert boundary has expanded southward.", "sa mạc", "1 chữ s (desert = sa mạc, nhấn âm 1); khác dessert (2 chữ s = món tráng miệng).", "dessert", ["dessert", "desart", "dezzert"]),
    ("dessert", "/dɪˈzɜːt/", "minimal_pair", "The conference banquet includes a seasonal fruit dessert and herbal tea.", "món tráng miệng", "2 chữ s, nhấn âm 2 /dɪˈzɜːt/; rất dễ nhầm chính tả với desert.", "desert", ["desert", "desart", "dessart"]),
    ("stationery", "/ˈsteɪʃənri/", "minimal_pair", "Students can purchase notebooks and exam stationery at the campus shop.", "văn phòng phẩm", "Đuôi -ery (e = envelope/paper); đồng âm hoàn toàn với stationary (đứng yên).", "stationary", ["stationary", "stationry", "stasionery"]),
    ("stationary", "/ˈsteɪʃənri/", "minimal_pair", "Traffic remained completely stationary along the ring road for nearly an hour.", "đứng yên, cố định", "Đuôi -ary (a = at rest); đồng âm với stationery (văn phòng phẩm).", "stationery", ["stationery", "stationry", "stasionary"]),
    ("principal", "/ˈprɪnsəpl/", "minimal_pair", "The college principal welcomed incoming scholars at the opening ceremony.", "hiệu trưởng; chính yếu", "Đuôi -pal (người đứng đầu hoặc chính); đồng âm với principle (nguyên tắc).", "principle", ["principle", "prinsipal", "principel"]),
    ("principle", "/ˈprɪnsəpl/", "minimal_pair", "The design is based on a simple thermodynamic principle discovered in 1824.", "nguyên tắc, nguyên lý", "Đuôi -ple (luật/quy tắc); đồng âm với principal (hiệu trưởng).", "principal", ["principal", "prinsiple", "principel"]),
    ("affect", "/əˈfekt/", "minimal_pair", "Rising ocean acidity can severely affect the growth of coral skeletons.", "ảnh hưởng (động từ)", "Thường là động từ; dễ nhầm với danh từ effect trong câu điền từ.", "effect", ["effect", "afect", "affact"]),
    ("effect", "/ɪˈfekt/", "minimal_pair", "Researchers measured the cooling effect of street trees across forty cities.", "tác động, hiệu ứng (danh từ)", "Thường là danh từ (sau mạo từ the/an); dễ nhầm với động từ affect.", "affect", ["affect", "efect", "effact"]),
    ("adapt", "/əˈdæpt/", "minimal_pair", "Arctic foxes adapt to freezing winters by growing thicker white fur.", "thích nghi", "Có chữ a (adapt = thích nghi); dễ nghe nhầm với adopt (nhận nuôi/áp dụng).", "adopt", ["adopt", "adept", "adabt"]),
    ("adopt", "/əˈdɒpt/", "minimal_pair", "Several municipal councils plan to adopt electric buses before 2030.", "áp dụng, thông qua; nhận nuôi", "Âm /ɒ/ (adopt = áp dụng); dễ nhầm với adapt (thích nghi).", "adapt", ["adapt", "adept", "adobt"]),
    ("complement", "/ˈkɒmplɪmənt/", "minimal_pair", "Practical laboratory sessions complement the theoretical lectures each week.", "bổ sung, làm hoàn chỉnh", "Chữ e (comple-ment = complete); đồng âm với compliment (lời khen).", "compliment", ["compliment", "complamant", "compelment"]),
    ("compliment", "/ˈkɒmplɪmənt/", "minimal_pair", "The visiting professor paid a warm compliment to the student research team.", "lời khen ngợi", "Chữ i (compli-ment = khen); đồng âm với complement (bổ sung).", "complement", ["complement", "complimant", "compliement"]),
    ("council", "/ˈkaʊnsl/", "minimal_pair", "The local city council approved funding for three new community parks.", "hội đồng (thành phố/địa phương)", "Đuôi -cil (cơ quan hành chính); đồng âm với counsel (cố vấn/lời khuyên).", "counsel", ["counsel", "counsil", "councel"]),
    ("counsel", "/ˈkaʊnsl/", "minimal_pair", "Career advisors offer confidential counsel to graduates seeking employment.", "lời khuyên, tư vấn", "Đuôi -sel (lời khuyên/luật sư tư vấn); đồng âm với council (hội đồng).", "council", ["council", "counsil", "councel"]),
    ("site", "/saɪt/", "minimal_pair", "Archaeologists discovered bronze tools near the ancient burial site.", "địa điểm, công trường", "Đồng âm với sight (thị giác/cảnh đẹp) và cite (trích dẫn).", "sight", ["sight", "cite", "syt"]),
    ("cite", "/saɪt/", "minimal_pair", "Academic writers must accurately cite every external source they consult.", "trích dẫn", "Đồng âm với site (địa điểm) và sight (tầm nhìn).", "site", ["site", "sight", "cyite"]),
    ("coarse", "/kɔːs/", "minimal_pair", "Coastal erosion often leaves behind layers of coarse gravel and shells.", "thô ráp (bề mặt/hạt)", "Đồng âm hoàn toàn với course (khóa học/dòng chảy).", "course", ["course", "corse", "coars"]),
    ("ensure", "/ɪnˈʃɔː(r)/", "minimal_pair", "Strict quality checks ensure that drinking water meets national safety standards.", "đảm bảo", "Bắt đầu bằng en- (đảm bảo); dễ nhầm với insure (mua bảo hiểm).", "insure", ["insure", "assure", "enshure"]),
    ("loose", "/luːs/", "minimal_pair", "Walkers should watch out for loose stones along the steep mountain path.", "lỏng lẻo, rời rạc", "2 chữ o, âm cuối vô thanh /s/; dễ nhầm với động từ lose (/luːz/).", "lose", ["lose", "loos", "louse"]),
    ("quiet", "/ˈkwaɪət/", "minimal_pair", "The reading room on the upper level is reserved for quiet individual study.", "yên tĩnh", "Đuôi -et (2 âm tiết /ˈkwaɪ.ət/); rất hay viết nhầm thành quite (khá).", "quite", ["quite", "quit", "queit"]),
    ("weather", "/ˈweðə(r)/", "minimal_pair", "Unpredictable mountain weather delayed the geological survey by two days.", "thời tiết", "Đồng âm với whether (liệu rằng); chú ý có chữ a sau e.", "whether", ["whether", "wether", "wheather"]),
    ("aloud", "/əˈlaʊd/", "minimal_pair", "Reading essays aloud can help learners detect awkward phrasing and rhythm.", "thành tiếng, to tiếng", "Đồng âm với allowed (được phép); hay gặp trong Listening Section 3.", "allowed", ["allowed", "alowd", "alloud"]),
    ("brake", "/breɪk/", "minimal_pair", "Cyclists should test their front brake before riding down wet hills.", "phanh xe", "Đồng âm với break (nghỉ giải lao / làm vỡ).", "break", ["break", "brak", "bracke"]),
    ("waist", "/weɪst/", "minimal_pair", "Safety harnesses must be fastened securely around the climber's waist.", "vòng eo", "Đồng âm với waste (rác thải / lãng phí).", "waste", ["waste", "waiste", "weast"]),
    ("thorough", "/ˈθʌrə/", "minimal_pair", "The inspector conducted a thorough review of the laboratory fire exits.", "kỹ lưỡng, triệt để", "Dễ nhầm chính tả và phát âm với through (xuyên qua).", "through", ["through", "thourough", "thorow"]),
    ("conscious", "/ˈkɒnʃəs/", "minimal_pair", "Modern consumers are increasingly conscious of the environmental footprint of clothing.", "có ý thức, nhận thức rõ", "Tính từ đuôi -scious; dễ nhầm với danh từ conscience (lương tâm).", "conscience", ["conscience", "concious", "consious"]),
    ("wander", "/ˈwɒndə(r)/", "minimal_pair", "Tourists are advised not to wander off the marked trails in the reserve.", "đi lang thang", "Có chữ a (/ˈwɒndə/); dễ nhầm với wonder (tự hỏi / kỳ quan).", "wonder", ["wonder", "wondar", "wandar"]),
    ("bare", "/beə(r)/", "minimal_pair", "Heavy grazing stripped the hillside bare, accelerating topsoil erosion.", "trống trải, trơ trụi", "Đồng âm với bear (con gấu / chịu đựng).", "bear", ["bear", "bair", "barea"]),
    ("elicit", "/ɪˈlɪsɪt/", "minimal_pair", "Open-ended interview questions tend to elicit far richer responses from participants.", "khơi gợi, thu được (thông tin)", "Bắt đầu bằng e- (khơi gợi); dễ nhầm với illicit (bất hợp pháp).", "illicit", ["illicit", "elisit", "ellicit"]),
    ("further", "/ˈfɜːðə(r)/", "minimal_pair", "Please contact the admissions office if you require any further information.", "thêm nữa, sâu hơn", "Dùng cho nghĩa trừu tượng (thêm thông tin); dễ nhầm với father (bố) hoặc farther.", "father", ["father", "farther", "futher"]),
    ("dairy", "/ˈdeəri/", "minimal_pair", "Plant-based alternatives now compete directly with traditional dairy products.", "sản phẩm từ sữa", "Đảo chữ ai -> ia thành diary (nhật ký); cực kỳ dễ sai chính tả.", "diary", ["diary", "deary", "darry"]),
    ("diary", "/ˈdaɪəri/", "minimal_pair", "Volunteers kept a detailed food diary for fourteen consecutive days.", "nhật ký, sổ ghi chép", "Chữ i đứng trước a (di-ary); dễ viết nhầm thành dairy (sữa).", "dairy", ["dairy", "diery", "diarry"]),
    ("lightning", "/ˈlaɪtnɪŋ/", "minimal_pair", "Tall copper rods protect historic church spires from direct lightning strikes.", "tia sét", "KHÔNG có chữ e ở giữa (lightning = sét; lightening = làm sáng/nhẹ đi).", "lightening", ["lightening", "litening", "lightining"]),
    ("breath", "/breθ/", "minimal_pair", "Deep breathing exercises help speakers steady their breath before presenting.", "hơi thở (danh từ)", "Không có chữ e cuối (danh từ /breθ/); khác động từ breathe (/briːð/).", "breathe", ["breathe", "breth", "braeth"]),

    # --- section4_academic (37 items) ---
    ("archaeology", "/ˌɑːkiˈɒlədʒi/", "section4_academic", "Recent advances in radar scanning have transformed modern field archaeology.", "khảo cổ học", "Có cụm aeo (arch-aeo-logy); cực hay xuất hiện trong Listening Section 4.", "archeology", ["archaelogy", "arcaeology", "archaealogy"]),
    ("photosynthesis", "/ˌfəʊtəʊˈsɪnθəsɪs/", "section4_academic", "Marine algae absorb carbon dioxide through the process of photosynthesis.", "quá trình quang hợp", "Ghép photo + synthesis (ph đọc /f/, syn dùng chữ y).", "fotosynthesis", ["fotosynthesis", "photosinthesis", "photosynthisis"]),
    ("biodiversity", "/ˌbaɪəʊdaɪˈvɜːsəti/", "section4_academic", "Protecting wetland corridors is vital for preserving regional biodiversity.", "đa dạng sinh học", "Ghép bio + diversity; chú ý viết liền không dấu gạch nối.", "bio-diversity", ["bio-diversity", "biodeversity", "biodiversaty"]),
    ("deforestation", "/ˌdiːˌfɒrɪˈsteɪʃn/", "section4_academic", "Rapid tropical deforestation reduces rainfall and destabilises local soils.", "nạn phá rừng", "1 chữ r (de-forest-ation), tránh nhầm thành deforrestation.", "deforrestation", ["deforrestation", "deforestasion", "diforestation"]),
    ("sustainability", "/səˌsteɪnəˈbɪləti/", "section4_academic", "Urban planners are prioritising long-term sustainability over short-term cost.", "tính bền vững", "Chú ý sustain-ability (ai trước n, đuôi -ability không phải -ibility).", "sustainibility", ["sustainibility", "sustanability", "sustainablity"]),
    ("infrastructure", "/ˈɪnfrəstrʌktʃə(r)/", "section4_academic", "Heavy investment in rail infrastructure eased commuter congestion dramatically.", "cơ sở hạ tầng", "Ghép infra + structure; hay bị thiếu chữ r đầu tiên (infastructure).", "infastructure", ["infastructure", "infrastructur", "infrastracture"]),
    ("curriculum", "/kəˈrɪkjələm/", "section4_academic", "Coding and media literacy have recently been added to the national curriculum.", "chương trình giảng dạy", "2 chữ r, 1 chữ l, đuôi -um (cur-ric-u-lum).", "curiculum", ["curiculum", "curriculumn", "curriculam"]),
    ("hypothesis", "/haɪˈpɒθəsɪs/", "section4_academic", "Field measurements were collected to test the team's initial hypothesis.", "giả thuyết khoa học", "Dùng y ở âm 1 (hy-poth-e-sis); số nhiều là hypotheses.", "hipothesis", ["hipothesis", "hypothisis", "hypothessis"]),
    ("excavation", "/ˌekskəˈveɪʃn/", "section4_academic", "The summer excavation uncovered pottery fragments dating back three millennia.", "cuộc khai quật", "Bắt đầu bằng ex-ca- (ex-ca-vation), tránh thiếu chữ c.", "exavation", ["exavation", "excavasion", "excevation"]),
    ("migration", "/maɪˈɡreɪʃn/", "section4_academic", "Artificial city lights can disorient songbirds during their nocturnal migration.", "sự di cư", "Khác với immigration (nhập cư) và emigration (di cư ra nước ngoài).", "imigration", ["imigration", "migrasion", "mygration"]),
    ("sediment", "/ˈsedɪmənt/", "section4_academic", "Layers of river sediment preserve pollen grains from ancient forests.", "trầm tích", "Âm giữa là i (sed-i-ment), không phải sedament.", "sedament", ["sedament", "sedimant", "cediment"]),
    ("glacier", "/ˈɡlæsiə(r)/", "section4_academic", "Meltwater from the shrinking glacier supplies drinking water to downstream towns.", "sông băng", "Đuôi -ier (gla-cier), phát âm khác cách viết nên rất dễ sai chính tả.", "glaciar", ["glaciar", "glasher", "glassier"]),
    ("hemisphere", "/ˈhemɪsfɪə(r)/", "section4_academic", "Seasons in the southern hemisphere occur opposite to those in Europe.", "bán cầu", "Ghép hemi + sphere (ph đọc /f/).", "hemisfere", ["hemisfere", "hemishpere", "hemosphere"]),
    ("precipitation", "/prɪˌsɪpɪˈteɪʃn/", "section4_academic", "Annual precipitation in the coastal range exceeds two thousand millimetres.", "lượng mưa / giáng thủy", "Chú ý pre-cip-i-ta-tion (chữ c đọc /s/).", "presipitation", ["presipitation", "percipitation", "precipitasion"]),
    ("ecosystem", "/ˈiːkəʊsɪstəm/", "section4_academic", "Introducing non-native predators can disrupt an entire island ecosystem.", "hệ sinh thái", "Viết liền eco + system, dùng y trong system.", "eco-system", ["eco-system", "ecosistem", "echosystem"]),
    ("pollination", "/ˌpɒlɪˈneɪʃn/", "section4_academic", "Wild solitary bees play a critical role in the pollination of orchard crops.", "sự thụ phấn", "2 chữ l (pol-li-nation), xuất phát từ pollen.", "polination", ["polination", "pollenation", "pollinasion"]),
    ("hibernation", "/ˌhaɪbəˈneɪʃn/", "section4_academic", "Ground squirrels lower their metabolic rate dramatically during winter hibernation.", "sự ngủ đông", "Bắt đầu bằng hi-ber- (không phải hybernation).", "hybernation", ["hybernation", "hibernasion", "hibirnation"]),
    ("nocturnal", "/nɒkˈtɜːnl/", "section4_academic", "Thermal cameras allowed biologists to track nocturnal mammals without disturbance.", "hoạt động về đêm", "Cụm ct + urn (noc-tur-nal).", "nocternal", ["nocternal", "nockturnal", "nocturnel"]),
    ("mammal", "/ˈmæml/", "section4_academic", "The blue whale is the largest marine mammal ever recorded on Earth.", "động vật có vú", "3 chữ m: m-a-m-m-a-l (2 chữ m ở giữa).", "mamal", ["mamal", "mammel", "mamall"]),
    ("amphibian", "/æmˈfɪbiən/", "section4_academic", "Frogs are sensitive indicator species because every amphibian absorbs water through its skin.", "động vật lưỡng cư", "Có ph đọc /f/ và đuôi -ian (am-phib-i-an).", "amfibian", ["amfibian", "amphibean", "amphibien"]),
    ("fossil", "/ˈfɒsl/", "section4_academic", "A remarkably intact leaf fossil was discovered inside the sandstone quarry.", "hóa thạch", "2 chữ s, đuôi -il (fos-sil, không phải fossle).", "fosil", ["fosil", "fossle", "fossel"]),
    ("manuscript", "/ˈmænjuskrɪpt/", "section4_academic", "Historians used ultraviolet light to read faded ink on the medieval manuscript.", "bản thảo viết tay", "Ghép manu (tay) + script (viết).", "manusript", ["manusript", "maniscript", "mannuscript"]),
    ("architecture", "/ˈɑːkɪtektʃə(r)/", "section4_academic", "Passive cooling techniques were central to traditional desert architecture.", "kiến trúc", "Cụm ch đọc /k/ (ar-chi-tec-ture).", "arkitecture", ["arkitecture", "architechture", "archtecture"]),
    ("acoustics", "/əˈkuːstɪks/", "section4_academic", "Curved timber panels were installed to improve the concert hall's acoustics.", "âm học, chất lượng âm thanh", "1 chữ c, ou đọc /uː/, luôn có s khi chỉ chất lượng âm thanh phòng.", "accoustics", ["accoustics", "acustics", "acousticks"]),
    ("algorithm", "/ˈælɡərɪðəm/", "section4_academic", "The forecasting algorithm analyses satellite cloud data every fifteen minutes.", "thuật toán", "Đuôi -rithm (r-i-t-h-m, không phải rythm).", "algorythm", ["algorythm", "algoritm", "alghorithm"]),
    ("antibiotic", "/ˌæntibaɪˈɒtɪk/", "section4_academic", "Overuse of veterinary drugs has accelerated bacterial antibiotic resistance.", "kháng sinh", "Ghép anti + biotic; chú ý không nhầm thành antabiotic.", "antabiotic", ["antabiotic", "antibiotick", "antybiotic"]),
    ("carbohydrate", "/ˌkɑːbəʊˈhaɪdreɪt/", "section4_academic", "Endurance athletes rely on complex carbohydrate sources for sustained energy.", "tinh bột, chất bột đường", "Có chữ y trong hydrate (carbo-hydrate).", "carbohidrate", ["carbohidrate", "carbohydrat", "cabohydrate"]),
    ("metabolism", "/məˈtæbəlɪzəm/", "section4_academic", "Cold water immersion temporarily raises a swimmer's resting metabolism.", "sự trao đổi chất", "Đuôi -ism (me-tab-o-lism), không viết metabolyzm.", "metabolyzm", ["metabolyzm", "metabolisim", "matabolism"]),
    ("fertiliser", "/ˈfɜːtəlaɪzə(r)/", "section4_academic", "Excess nitrogen fertiliser washed from farmland can trigger coastal algal blooms.", "phân bón", "Anh-Anh dùng -iser (Mỹ: fertilizer); có chữ i giữa t và l.", "fertaliser", ["fertaliser", "ferteliser", "fertilisser"]),
    ("irrigation", "/ˌɪrɪˈɡeɪʃn/", "section4_academic", "Drip irrigation cuts agricultural water losses by nearly half in arid regions.", "hệ thống tưới tiêu", "2 chữ r (ir-ri-gation); dễ thiếu 1 chữ r.", "irigation", ["irigation", "irrigasion", "erigation"]),
    ("geothermal", "/ˌdʒiːəʊˈθɜːml/", "section4_academic", "Iceland generates a large share of its district heating from geothermal wells.", "địa nhiệt", "Ghép geo + thermal (th + er + mal).", "geothermel", ["geothermel", "giothermal", "geotharmal"]),
    ("hydroelectric", "/ˌhaɪdrəʊɪˈlektrɪk/", "section4_academic", "Mountain reservoirs power several hydroelectric stations across the valley.", "thủy điện", "Ghép hydro (y) + electric; viết liền 1 từ.", "hidroelectric", ["hidroelectric", "hydro-eletric", "hydroelectrik"]),
    ("urbanisation", "/ˌɜːbənaɪˈzeɪʃn/", "section4_academic", "Rapid urbanisation has placed unprecedented pressure on municipal drainage systems.", "đô thị hóa", "Anh-Anh dùng -isation (Mỹ: urbanization).", "urbanisasion", ["urbanisasion", "urbenisation", "urbanizasion"]),
    ("pesticide", "/ˈpestɪsaɪd/", "section4_academic", "Organic orchards employ beneficial insects to minimise chemical pesticide use.", "thuốc trừ sâu", "Đuôi -cide (diệt), âm giữa là i (pes-ti-cide).", "pestaside", ["pestaside", "pestiside", "pestycide"]),
    ("cholesterol", "/kəˈlestərɒl/", "section4_academic", "Dietary fibre from oats helps lower harmful blood cholesterol levels.", "chất béo cholesterol", "Bắt đầu bằng ch đọc /k/ (cho-les-ter-ol).", "colesterol", ["colesterol", "choleserol", "cholestorol"]),
    ("excavator", "/ˈekskəveɪtə(r)/", "section4_academic", "The engineering team brought in a compact excavator to clear the drainage channel.", "máy đào, người khai quật", "Đuôi -or (không phải -er), có chữ c sau ex-.", "excavater", ["excavater", "exavator", "excevator"]),
    ("symposium", "/sɪmˈpəʊziəm/", "section4_academic", "Biologists from twelve countries attended the annual climate symposium in Lisbon.", "hội nghị chuyên đề", "Chữ y ở âm đầu (sym-po-sium) và đuôi -ium.", "simposium", ["simposium", "symposeum", "symposiam"]),
]


def build_listening(anki_decks: dict[str, list[dict]]) -> list[dict]:
    items: list[dict] = []
    seen: set[str] = set()
    idx = 1

    # 1. Extract all 61 items from Anki `9. Listening · Chính tả`
    anki_list = []
    for dname, notes in anki_decks.items():
        if "9. Listening" in dname:
            anki_list.extend(notes)

    for note in anki_list:
        fields = note["fields"]
        if len(fields) < 4:
            continue
        word, meaning_vi, group_vi, trap_vi = fields[0], fields[1], fields[2], fields[3]
        if not word or word.lower() in seen:
            continue
        if word in ANKI_LISTENING_ENRICHMENT:
            ipa, category, audio_text, common_mistake, distractors = ANKI_LISTENING_ENRICHMENT[word]
        else:
            ipa = f"/{word.lower()}/"
            category = "spelling_trap"
            audio_text = f"In the IELTS Listening recording, pay close attention to the spelling of {word}."
            common_mistake = word[:-1] if len(word) > 3 else word + "s"
            distractors = [common_mistake, word + "e", word.replace("e", "a", 1) if "e" in word else word + "s"]

        full_trap = f"[{group_vi}] {trap_vi}" if group_vi else trap_vi
        items.append(
            {
                "id": f"lst_{idx:03d}",
                "word": word,
                "ipa": ipa,
                "audioText": audio_text,
                "category": category,
                "meaningVi": meaning_vi,
                "trapExplanationVi": full_trap,
                "commonMistake": common_mistake,
                "distractors": distractors,
            }
        )
        seen.add(word.lower())
        idx += 1

    # Fallback if Anki DB wasn't present on another machine: still include all enriched Anki words
    for word, (ipa, category, audio_text, common_mistake, distractors) in ANKI_LISTENING_ENRICHMENT.items():
        if word.lower() not in seen:
            items.append(
                {
                    "id": f"lst_{idx:03d}",
                    "word": word,
                    "ipa": ipa,
                    "audioText": audio_text,
                    "category": category,
                    "meaningVi": f"từ vựng Listening: {word}",
                    "trapExplanationVi": f"Bẫy chính tả hay gặp trong IELTS Listening (tránh viết nhầm thành {common_mistake}).",
                    "commonMistake": common_mistake,
                    "distractors": distractors,
                }
            )
            seen.add(word.lower())
            idx += 1

    # 2. Add curated Cambridge IELTS 8.0 Listening items
    for word, ipa, category, audio_text, meaning_vi, trap_vi, common_mistake, distractors in EXTRA_LISTENING_ITEMS:
        if word.lower() in seen:
            continue
        items.append(
            {
                "id": f"lst_{idx:03d}",
                "word": word,
                "ipa": ipa,
                "audioText": audio_text,
                "category": category,
                "meaningVi": meaning_vi,
                "trapExplanationVi": trap_vi,
                "commonMistake": common_mistake,
                "distractors": distractors,
            }
        )
        seen.add(word.lower())
        idx += 1

    return items


# ==============================================================================
# SECTION 2: READING PASSAGES (12 passages: A01-A05 from Anki + A06-A12 new)
# ==============================================================================

PASSAGES_DATA: list[dict] = [
    {
        "id": "rd_a01",
        "code": "A01",
        "title": "Urban Trees Cool Cities More Than Expected, Yet Limits Remain",
        "topic": "Urban & Environment",
        "ankiKey": "A01",
        "paragraphs": [
            "Across rapidly expanding metropolitan areas, dark asphalt roads and dense concrete towers intensify the urban heat island effect, leaving city centres noticeably warmer than surrounding rural landscapes. A large international study recently revealed that street trees counteract extreme summer heat far more effectively than researchers had previously anticipated.",
            "Urban greenery lowers neighbourhood temperatures through two complementary mechanisms. First, a dense tree canopy shields pavements and facades from direct solar radiation. Second, leaves release moisture into the air via transpiration, drawing thermal energy away from nearby streets. However, cooling performance varies sharply by climate: trees deliver strong relief in dry, temperate cities, whereas their evaporative benefit declines significantly in hot, humid conditions.",
            "Despite these encouraging results, scientists caution against treating tree planting as a standalone solution to escalating global temperatures. Existing urban forests offset only a modest fraction of human-driven warming. Even the most ambitious municipal planting programmes require decades to mature and must therefore be paired with reflective roofs, shaded corridors, and rapid reductions in carbon emissions."
        ],
        "highlights": [
            {"phrase": "urban heat island", "meaningVi": "đảo nhiệt đô thị", "ipa": "/ˌɜːbən ˈhiːt ˌaɪlənd/"},
            {"phrase": "counteract", "meaningVi": "chống lại, trung hòa (tác động)", "ipa": "/ˌkaʊntərˈækt/"},
            {"phrase": "anticipated", "meaningVi": "được dự đoán trước", "ipa": "/ænˈtɪsɪpeɪtɪd/"},
            {"phrase": "canopy", "meaningVi": "tán cây", "ipa": "/ˈkænəpi/"},
            {"phrase": "transpiration", "meaningVi": "sự thoát hơi nước (ở lá cây)", "ipa": "/ˌtrænspɪˈreɪʃn/"},
            {"phrase": "temperate", "meaningVi": "ôn đới, ôn hòa", "ipa": "/ˈtempərət/"},
            {"phrase": "humid", "meaningVi": "ẩm, oi", "ipa": "/ˈhjuːmɪd/"},
            {"phrase": "escalating", "meaningVi": "leo thang, ngày càng tăng", "ipa": "/ˈeskəleɪtɪŋ/"},
            {"phrase": "offset", "meaningVi": "bù đắp, bù trừ", "ipa": "/ˈɒfset/"},
            {"phrase": "ambitious", "meaningVi": "đầy tham vọng, quy mô lớn", "ipa": "/æmˈbɪʃəs/"}
        ],
        "tfngQuestions": [
            {
                "id": "a01_tf1",
                "statement": "Recent international research found that urban trees provide greater cooling than scientists had earlier predicted.",
                "answer": "TRUE",
                "evidenceQuote": "A large international study recently revealed that street trees counteract extreme summer heat far more effectively than researchers had previously anticipated.",
                "explanationVi": "Bài đọc khẳng định hiệu quả làm mát của cây xanh đường phố lớn hơn nhiều so với mức các nhà nghiên cứu từng dự đoán (anticipated = predicted)."
            },
            {
                "id": "a01_tf2",
                "statement": "Tree transpiration cools urban air more effectively in humid climates than in dry temperate regions.",
                "answer": "FALSE",
                "evidenceQuote": "trees deliver strong relief in dry, temperate cities, whereas their evaporative benefit declines significantly in hot, humid conditions.",
                "explanationVi": "Ngược với bài đọc: hiệu quả làm mát bằng thoát hơi nước giảm mạnh trong điều kiện nóng ẩm (humid conditions)."
            },
            {
                "id": "a01_tf3",
                "statement": "Deciduous tree species provide significantly greater street shade than evergreen species during summer.",
                "answer": "NOT GIVEN",
                "evidenceQuote": "First, a dense tree canopy shields pavements and facades from direct solar radiation.",
                "explanationVi": "Bài đọc chỉ nhắc đến tán cây dày (dense tree canopy), hoàn toàn không so sánh giữa cây rụng lá (deciduous) và cây thường xanh (evergreen)."
            },
            {
                "id": "a01_tf4",
                "statement": "Scientists argue that large-scale tree planting alone is insufficient to solve rising urban temperatures.",
                "answer": "TRUE",
                "evidenceQuote": "scientists caution against treating tree planting as a standalone solution to escalating global temperatures.",
                "explanationVi": "Tác giả nhấn mạnh không thể coi trồng cây là giải pháp đơn lẻ (standalone solution) mà cần kết hợp mái phản nhiệt và giảm phát thải."
            }
        ],
        "paraphraseTargets": [
            {
                "id": "a01_p1",
                "questionPhrase": "neutralise severe summer heat",
                "targetInPassage": "counteract extreme summer heat",
                "distractors": ["escalating global temperatures", "urban heat island effect", "direct solar radiation"],
                "explanationVi": "counteract = neutralise (chống lại, trung hòa); extreme = severe (khắc nghiệt)."
            },
            {
                "id": "a01_p2",
                "questionPhrase": "expected by researchers earlier",
                "targetInPassage": "previously anticipated",
                "distractors": ["delivers strong relief", "rapid reductions", "modest fraction"],
                "explanationVi": "previously anticipated đồng nghĩa với expected earlier (đã được dự đoán trước đó)."
            },
            {
                "id": "a01_p3",
                "questionPhrase": "compensate for only a small part",
                "targetInPassage": "offset only a modest fraction",
                "distractors": ["decline significantly", "shield pavements", "require decades to mature"],
                "explanationVi": "offset = compensate for (bù đắp); a modest fraction = a small part (một phần nhỏ)."
            },
            {
                "id": "a01_p4",
                "questionPhrase": "large-scale city tree schemes",
                "targetInPassage": "ambitious municipal planting programmes",
                "distractors": ["surrounding rural landscapes", "shaded corridors", "existing urban forests"],
                "explanationVi": "ambitious = large-scale; municipal = city; planting programmes = tree schemes."
            }
        ]
    },
    {
        "id": "rd_a02",
        "code": "A02",
        "title": "Why Screen Time Guidelines Are Moving Beyond Strict Daily Limits",
        "topic": "Technology & Child Development",
        "ankiKey": "A02",
        "paragraphs": [
            "For years, paediatric bodies treated digital media as a single monolith, advising parents simply to count the hours children spent facing a screen. Today, mounting developmental research paints a far more multifaceted picture, prompting official advice to diverge sharply from rigid time caps.",
            "Psychologists emphasise that passive scrolling at midnight affects teenagers very differently from collaborative coding or video calling distant grandparents. While excessive device use can certainly curb physical activity and crowd out sleep or face-to-face play, strict one-size-fits-all bans frequently backfire. Overly controlling restrictions may undermine adolescents' growing sense of autonomy and push unhealthy habits out of sight rather than resolving them.",
            "Consequently, contemporary guidelines prioritise active parental mediation over blanket prohibition. Instead of policing a stopwatch, adults are encouraged to discuss online content, establish screen-free meal and bedtime routines, and recognise that children closely emulate the digital habits they observe at home. When parents put their own phones away during family conversations, young people develop healthier self-regulation naturally."
        ],
        "highlights": [
            {"phrase": "monolith", "meaningVi": "khối đồng nhất (coi mọi thứ như một)", "ipa": "/ˈmɒnəlɪθ/"},
            {"phrase": "mounting", "meaningVi": "ngày càng tăng", "ipa": "/ˈmaʊntɪŋ/"},
            {"phrase": "multifaceted", "meaningVi": "nhiều mặt, đa diện", "ipa": "/ˌmʌltiˈfæsɪtɪd/"},
            {"phrase": "diverge", "meaningVi": "rẽ khác, tách khỏi", "ipa": "/daɪˈvɜːdʒ/"},
            {"phrase": "curb", "meaningVi": "kiềm chế, hạn chế", "ipa": "/kɜːb/"},
            {"phrase": "crowd out", "meaningVi": "chèn lấn, chiếm chỗ", "ipa": "/ˌkraʊd ˈaʊt/"},
            {"phrase": "one-size-fits-all", "meaningVi": "một kiểu áp dụng cho tất cả", "ipa": "/ˌwʌn saɪz fɪts ˈɔːl/"},
            {"phrase": "autonomy", "meaningVi": "quyền tự chủ", "ipa": "/ɔːˈtɒnəmi/"},
            {"phrase": "mediation", "meaningVi": "sự định hướng, can thiệp (của người lớn)", "ipa": "/ˌmiːdiˈeɪʃn/"},
            {"phrase": "emulate", "meaningVi": "bắt chước, noi theo", "ipa": "/ˈemjuleɪt/"}
        ],
        "tfngQuestions": [
            {
                "id": "a02_tf1",
                "statement": "Modern screen time advice still relies primarily on setting a single fixed daily hour limit for all children.",
                "answer": "FALSE",
                "evidenceQuote": "Today, mounting developmental research paints a far more multifaceted picture, prompting official advice to diverge sharply from rigid time caps.",
                "explanationVi": "Khuyến nghị hiện đại đã tách khỏi (diverge sharply from) các giới hạn giờ cứng nhắc áp dụng chung cho mọi trẻ."
            },
            {
                "id": "a02_tf2",
                "statement": "Excessive screen exposure can reduce the time children spend sleeping and interacting in person.",
                "answer": "TRUE",
                "evidenceQuote": "excessive device use can certainly curb physical activity and crowd out sleep or face-to-face play",
                "explanationVi": "crowd out = chiếm mất thời gian của giấc ngủ và vui chơi trực tiếp (face-to-face play)."
            },
            {
                "id": "a02_tf3",
                "statement": "Educational video games have been shown to raise teenage mathematics test scores by fifteen percent.",
                "answer": "NOT GIVEN",
                "evidenceQuote": "Psychologists emphasise that passive scrolling at midnight affects teenagers very differently from collaborative coding or video calling distant grandparents.",
                "explanationVi": "Bài đọc chỉ nêu ví dụ lập trình nhóm và gọi video, không hề đề cập đến trò chơi toán học hay con số 15%."
            },
            {
                "id": "a02_tf4",
                "statement": "Parents' own phone behaviour influences how children learn to manage their devices.",
                "answer": "TRUE",
                "evidenceQuote": "children closely emulate the digital habits they observe at home.",
                "explanationVi": "Trẻ bắt chước sát sao (emulate) thói quen dùng thiết bị số của cha mẹ ngay trong gia đình."
            }
        ],
        "paraphraseTargets": [
            {
                "id": "a02_p1",
                "questionPhrase": "growing body of evidence",
                "targetInPassage": "mounting developmental research",
                "distractors": ["rigid time caps", "family conversations", "blanket prohibition"],
                "explanationVi": "mounting = growing (ngày càng tăng); developmental research = evidence về sự phát triển."
            },
            {
                "id": "a02_p2",
                "questionPhrase": "displace sleep and in-person interaction",
                "targetInPassage": "crowd out sleep or face-to-face play",
                "distractors": ["curb physical activity", "policing a stopwatch", "collaborative coding"],
                "explanationVi": "crowd out = displace (chèn lấn, đẩy ra); face-to-face play = in-person interaction."
            },
            {
                "id": "a02_p3",
                "questionPhrase": "uniform restrictions for everyone",
                "targetInPassage": "one-size-fits-all bans",
                "distractors": ["active parental mediation", "screen-free meal", "digital habits"],
                "explanationVi": "one-size-fits-all = uniform for everyone (đồng loạt một khuôn cho tất cả)."
            },
            {
                "id": "a02_p4",
                "questionPhrase": "copy the behaviours they witness",
                "targetInPassage": "emulate the digital habits they observe",
                "distractors": ["diverge sharply", "undermine adolescents' growing sense", "develop healthier self-regulation"],
                "explanationVi": "emulate = copy/imitate (bắt chước); observe = witness (quan sát)."
            }
        ]
    },
    {
        "id": "rd_a03",
        "code": "A03",
        "title": "Lessons From Australia's Four-Day Work Week Trial",
        "topic": "Work & Economy",
        "ankiKey": "A03",
        "paragraphs": [
            "Nearly a century ago, economist John Maynard Keynes predicted that technological progress would deliver a fifteen-hour working week. Although that vision never materialised, rapid advances in artificial intelligence have revived debate over how societies should redistribute future productivity gains equitably rather than allowing automation simply to displace human staff.",
            "In a recent six-month trial, fifteen Australian organisations grappling with workplace burnout moved to a four-day week without reducing salaries. To gauge whether the model succeeded, researchers tracked revenue, staff attrition, sick leave, and overall absenteeism alongside employee wellbeing surveys. Most participating firms maintained or exceeded previous output by streamlining unnecessary meetings and protecting uninterrupted focus hours.",
            "Despite overwhelmingly positive feedback from managers and workers alike, researchers urge careful interpretation of the results. Companies volunteering for such pilots are rarely typical of the wider economy, and self-reported wellbeing scores carry a clear risk of bias. Expanding shortened schedules into hospitals, hospitality, and round-the-clock manufacturing will demand far more creative rostering than office trials alone."
        ],
        "highlights": [
            {"phrase": "materialise", "meaningVi": "thành hiện thực", "ipa": "/məˈtɪəriəlaɪz/"},
            {"phrase": "redistribute", "meaningVi": "phân phối lại", "ipa": "/ˌriːdɪˈstrɪbjuːt/"},
            {"phrase": "productivity gains", "meaningVi": "mức tăng năng suất", "ipa": "/ˌprɒdʌkˈtɪvəti ɡeɪnz/"},
            {"phrase": "equitably", "meaningVi": "một cách công bằng", "ipa": "/ˈekwɪtəbli/"},
            {"phrase": "displace", "meaningVi": "thay thế, đẩy ra khỏi", "ipa": "/dɪsˈpleɪs/"},
            {"phrase": "grappling with", "meaningVi": "vật lộn với (vấn đề)", "ipa": "/ˈɡræpl wɪð/"},
            {"phrase": "gauge", "meaningVi": "đánh giá, đo lường", "ipa": "/ɡeɪdʒ/"},
            {"phrase": "attrition", "meaningVi": "tỷ lệ nhân viên nghỉ việc", "ipa": "/əˈtrɪʃn/"},
            {"phrase": "absenteeism", "meaningVi": "tình trạng nghỉ làm thường xuyên", "ipa": "/ˌæbsənˈtiːɪzəm/"},
            {"phrase": "bias", "meaningVi": "sự thiên lệch", "ipa": "/ˈbaɪəs/"}
        ],
        "tfngQuestions": [
            {
                "id": "a03_tf1",
                "statement": "Employees participating in the Australian trial had their pay cut by twenty percent in exchange for an extra day off.",
                "answer": "FALSE",
                "evidenceQuote": "fifteen Australian organisations grappling with workplace burnout moved to a four-day week without reducing salaries.",
                "explanationVi": "Sai: các công ty chuyển sang tuần làm việc 4 ngày mà KHÔNG giảm lương (without reducing salaries)."
            },
            {
                "id": "a03_tf2",
                "statement": "Participating firms preserved output largely by cutting redundant meetings and safeguarding deep-work time.",
                "answer": "TRUE",
                "evidenceQuote": "Most participating firms maintained or exceeded previous output by streamlining unnecessary meetings and protecting uninterrupted focus hours.",
                "explanationVi": "Đúng: streamlining unnecessary meetings = cắt giảm họp thừa; protecting uninterrupted focus hours = bảo vệ giờ làm tập trung."
            },
            {
                "id": "a03_tf3",
                "statement": "The Australian federal government financed the six-month pilot across all fifteen participating companies.",
                "answer": "NOT GIVEN",
                "evidenceQuote": "In a recent six-month trial, fifteen Australian organisations grappling with workplace burnout moved to a four-day week without reducing salaries.",
                "explanationVi": "Bài không đề cập đến nguồn tài trợ hay sự tham gia của chính phủ liên bang Úc."
            },
            {
                "id": "a03_tf4",
                "statement": "Researchers warn that survey responses from voluntary pilot firms may not accurately reflect all industries.",
                "answer": "TRUE",
                "evidenceQuote": "Companies volunteering for such pilots are rarely typical of the wider economy, and self-reported wellbeing scores carry a clear risk of bias.",
                "explanationVi": "Đúng: các công ty tự nguyện hiếm khi đại diện cho toàn nền kinh tế và điểm tự báo cáo có nguy cơ thiên lệch (bias)."
            }
        ],
        "paraphraseTargets": [
            {
                "id": "a03_p1",
                "questionPhrase": "never came about",
                "targetInPassage": "never materialised",
                "distractors": ["revived debate", "maintained or exceeded", "risk of bias"],
                "explanationVi": "materialise = come about / happen (trở thành hiện thực)."
            },
            {
                "id": "a03_p2",
                "questionPhrase": "share efficiency improvements fairly",
                "targetInPassage": "redistribute future productivity gains equitably",
                "distractors": ["displace human staff", "without reducing salaries", "creative rostering"],
                "explanationVi": "redistribute = share; productivity gains = efficiency improvements; equitably = fairly."
            },
            {
                "id": "a03_p3",
                "questionPhrase": "struggling to deal with employee exhaustion",
                "targetInPassage": "grappling with workplace burnout",
                "distractors": ["tracked revenue", "uninterrupted focus hours", "wider economy"],
                "explanationVi": "grapple with = struggle to deal with; workplace burnout = employee exhaustion."
            },
            {
                "id": "a03_p4",
                "questionPhrase": "measure employee turnover",
                "targetInPassage": "tracked revenue, staff attrition",
                "distractors": ["shortened schedules", "self-reported wellbeing", "previous output"],
                "explanationVi": "staff attrition = employee turnover (tỷ lệ nhân sự nghỉ việc)."
            }
        ]
    },
    {
        "id": "rd_a04",
        "code": "A04",
        "title": "Ultra-Processed Foods and Bowel Cancer: A Closer Look at the Evidence",
        "topic": "Health & Nutrition",
        "ankiKey": "A04",
        "paragraphs": [
            "Headlines frequently link ultra-processed foods to chronic illness, yet earlier epidemiological studies produced inconsistent findings regarding bowel cancer incidence. One explanation is that grouping every packaged food together can mask major nutritional differences between wholegrain breakfast cereals and reconstituted meat products such as sausages or deli slices.",
            "In a large longitudinal cohort, researchers analysed dietary questionnaires alongside medical records to examine whether swapping just ten percent of ultra-processed intake for minimally processed whole foods altered cancer risk. To verify how accurately the questionnaire could capture real eating habits, a subset of participants also completed detailed multi-day food diaries. Even after statistical models accounted for smoking, exercise, and body mass, higher intake of processed meats showed a clearer association with bowel cancer than total ultra-processed consumption alone.",
            "Nevertheless, nutrition scientists remind the public to exercise caution when reading dramatic diet headlines. Because observational studies cannot definitively prove cause and effect, gradual shifts toward fibre-rich vegetables, legumes, and unprocessed proteins remain the most sensible preventive strategy."
        ],
        "highlights": [
            {"phrase": "inconsistent", "meaningVi": "không nhất quán", "ipa": "/ˌɪnkənˈsɪstənt/"},
            {"phrase": "incidence", "meaningVi": "tỷ lệ mắc (ca mới)", "ipa": "/ˈɪnsɪdəns/"},
            {"phrase": "mask", "meaningVi": "che lấp, che giấu", "ipa": "/mɑːsk/"},
            {"phrase": "reconstituted", "meaningVi": "được tái chế biến, hoàn nguyên", "ipa": "/riːˈkɒnstɪtjuːtɪd/"},
            {"phrase": "capture", "meaningVi": "ghi nhận, đo được", "ipa": "/ˈkæptʃə(r)/"},
            {"phrase": "subset", "meaningVi": "nhóm con", "ipa": "/ˈsʌbset/"},
            {"phrase": "accounted for", "meaningVi": "tính đến (yếu tố); chiếm (tỷ lệ)", "ipa": "/əˈkaʊnt fɔː(r)/"},
            {"phrase": "association", "meaningVi": "mối liên hệ (thống kê)", "ipa": "/əˌsəʊsiˈeɪʃn/"},
            {"phrase": "exercise caution", "meaningVi": "thận trọng", "ipa": "/ˈeksəsaɪz ˈkɔːʃn/"},
            {"phrase": "cause and effect", "meaningVi": "quan hệ nhân quả", "ipa": "/ˌkɔːz ənd ɪˈfekt/"}
        ],
        "tfngQuestions": [
            {
                "id": "a04_tf1",
                "statement": "Previous studies on ultra-processed foods and bowel cancer had always reached identical conclusions.",
                "answer": "FALSE",
                "evidenceQuote": "earlier epidemiological studies produced inconsistent findings regarding bowel cancer incidence.",
                "explanationVi": "Sai: các nghiên cứu trước cho kết quả không nhất quán (inconsistent findings), không hề đồng nhất."
            },
            {
                "id": "a04_tf2",
                "statement": "A smaller group of volunteers kept multi-day food diaries to check the reliability of the survey.",
                "answer": "TRUE",
                "evidenceQuote": "To verify how accurately the questionnaire could capture real eating habits, a subset of participants also completed detailed multi-day food diaries.",
                "explanationVi": "Đúng: subset of participants = a smaller group of volunteers; verify how accurately = check reliability."
            },
            {
                "id": "a04_tf3",
                "statement": "Participants who drank sweetened soft drinks faced twice the bowel cancer risk of those who ate sausages.",
                "answer": "NOT GIVEN",
                "evidenceQuote": "higher intake of processed meats showed a clearer association with bowel cancer than total ultra-processed consumption alone.",
                "explanationVi": "Bài không nhắc đến nước ngọt có đường (sweetened soft drinks) hay tỷ lệ gấp đôi."
            },
            {
                "id": "a04_tf4",
                "statement": "The researchers state that observational dietary data alone cannot establish direct causation.",
                "answer": "TRUE",
                "evidenceQuote": "Because observational studies cannot definitively prove cause and effect",
                "explanationVi": "Đúng: prove cause and effect = establish direct causation (chứng minh quan hệ nhân quả)."
            }
        ],
        "paraphraseTargets": [
            {
                "id": "a04_p1",
                "questionPhrase": "conflicting research outcomes",
                "targetInPassage": "inconsistent findings",
                "distractors": ["chronic illness", "medical records", "preventive strategy"],
                "explanationVi": "inconsistent = conflicting (mâu thuẫn, không nhất quán); findings = research outcomes."
            },
            {
                "id": "a04_p2",
                "questionPhrase": "obscure important nutritional contrasts",
                "targetInPassage": "mask major nutritional differences",
                "distractors": ["altered cancer risk", "capture real eating habits", "gradual shifts"],
                "explanationVi": "mask = obscure/conceal (che lấp); major = important; differences = contrasts."
            },
            {
                "id": "a04_p3",
                "questionPhrase": "controlled for lifestyle variables",
                "targetInPassage": "accounted for smoking, exercise, and body mass",
                "distractors": ["completed detailed multi-day food diaries", "clearer association", "wholegrain breakfast cereals"],
                "explanationVi": "account for = take into account / control for (tính đến yếu tố gây nhiễu)."
            },
            {
                "id": "a04_p4",
                "questionPhrase": "be wary of sensational news",
                "targetInPassage": "exercise caution when reading dramatic diet headlines",
                "distractors": ["definitively prove", "minimally processed whole foods", "reconstituted meat products"],
                "explanationVi": "exercise caution = be wary/careful (thận trọng); dramatic headlines = sensational news."
            }
        ]
    },
    {
        "id": "rd_a05",
        "code": "A05",
        "title": "What Workers Actually Report About AI and Job Losses",
        "topic": "Technology & Labour Market",
        "ankiKey": "A05",
        "paragraphs": [
            "Public debate around artificial intelligence has generated intense speculation, with pessimists warning of mass layoffs while optimists promise effortless prosperity. Yet until recently, labour economists lacked solid data capturing how ordinary employees were actually experiencing workplace automation.",
            "To bridge this gap, a sociologist surveyed thousands of adult workers across multiple industries. Surprisingly, substantial job displacement caused directly by AI remained a rarity: only a tiny minority reported losing a position or having hours cut because of automated software. Far from triggering widespread unemployment, AI tools were mostly used to draft routine emails, summarise reports, or assist with coding tasks.",
            "Still, the author notes two important caveats. First, any single survey offers only a temporary snapshot of a fast-moving technology. Second, online panels rely partly on self-selected respondents, which can skew estimates. Over the coming decade, automated systems could still render certain entry-level duties obsolete, making it harder for young graduates to climb the first rung of the career ladder."
        ],
        "highlights": [
            {"phrase": "speculation", "meaningVi": "sự suy đoán", "ipa": "/ˌspekjuˈleɪʃn/"},
            {"phrase": "pessimist", "meaningVi": "người bi quan", "ipa": "/ˈpesɪmɪst/"},
            {"phrase": "solid data", "meaningVi": "dữ liệu đáng tin cậy", "ipa": "/ˌsɒlɪd ˈdeɪtə/"},
            {"phrase": "substantial", "meaningVi": "đáng kể, lớn", "ipa": "/səbˈstænʃl/"},
            {"phrase": "rarity", "meaningVi": "điều hiếm có", "ipa": "/ˈreərəti/"},
            {"phrase": "widespread", "meaningVi": "phổ biến, lan rộng", "ipa": "/ˈwaɪdspred/"},
            {"phrase": "snapshot", "meaningVi": "bức tranh tại một thời điểm", "ipa": "/ˈsnæpʃɒt/"},
            {"phrase": "self-selected", "meaningVi": "tự chọn tham gia (không ngẫu nhiên)", "ipa": "/ˌself sɪˈlektɪd/"},
            {"phrase": "render", "meaningVi": "khiến cho (trở nên)", "ipa": "/ˈrendə(r)/"},
            {"phrase": "career ladder", "meaningVi": "nấc thang sự nghiệp", "ipa": "/kəˈrɪə ˌlædə(r)/"}
        ],
        "tfngQuestions": [
            {
                "id": "a05_tf1",
                "statement": "The worker survey showed that AI had already caused massive, widespread job losses across most industries.",
                "answer": "FALSE",
                "evidenceQuote": "substantial job displacement caused directly by AI remained a rarity: only a tiny minority reported losing a position",
                "explanationVi": "Sai: việc mất việc quy mô lớn vì AI vẫn còn rất hiếm (remained a rarity), chỉ một nhóm rất nhỏ bị ảnh hưởng."
            },
            {
                "id": "a05_tf2",
                "statement": "The sociologist acknowledges that a one-off survey only captures conditions at a single point in time.",
                "answer": "TRUE",
                "evidenceQuote": "any single survey offers only a temporary snapshot of a fast-moving technology.",
                "explanationVi": "Đúng: temporary snapshot = bức tranh tại một thời điểm nhất định."
            },
            {
                "id": "a05_tf3",
                "statement": "Software engineers experienced higher pay rises after adopting AI tools than healthcare staff did.",
                "answer": "NOT GIVEN",
                "evidenceQuote": "AI tools were mostly used to draft routine emails, summarise reports, or assist with coding tasks.",
                "explanationVi": "Bài chỉ nhắc AI hỗ trợ viết code chứ không hề so sánh mức tăng lương giữa kỹ sư phần mềm và nhân viên y tế."
            },
            {
                "id": "a05_tf4",
                "statement": "Future automation could make it more difficult for recent graduates to enter professional career paths.",
                "answer": "TRUE",
                "evidenceQuote": "automated systems could still render certain entry-level duties obsolete, making it harder for young graduates to climb the first rung of the career ladder.",
                "explanationVi": "Đúng: AI có thể làm các nhiệm vụ sơ cấp lỗi thời, khiến sinh viên mới ra trường khó bước lên nấc đầu tiên của sự nghiệp."
            }
        ],
        "paraphraseTargets": [
            {
                "id": "a05_p1",
                "questionPhrase": "reliable statistical evidence",
                "targetInPassage": "solid data",
                "distractors": ["intense speculation", "mass layoffs", "routine emails"],
                "explanationVi": "solid data = reliable evidence / hard data (dữ liệu đáng tin cậy)."
            },
            {
                "id": "a05_p2",
                "questionPhrase": "major job losses were uncommon",
                "targetInPassage": "substantial job displacement caused directly by AI remained a rarity",
                "distractors": ["widespread unemployment", "effortless prosperity", "important caveats"],
                "explanationVi": "substantial = major (đáng kể); remained a rarity = was uncommon (vẫn còn hiếm)."
            },
            {
                "id": "a05_p3",
                "questionPhrase": "voluntary participants who may distort findings",
                "targetInPassage": "self-selected respondents, which can skew estimates",
                "distractors": ["adult workers across multiple industries", "temporary snapshot", "tiny minority"],
                "explanationVi": "self-selected respondents = voluntary participants; skew estimates = distort findings."
            },
            {
                "id": "a05_p4",
                "questionPhrase": "make junior tasks outdated",
                "targetInPassage": "render certain entry-level duties obsolete",
                "distractors": ["draft routine emails", "bridge this gap", "climb the first rung"],
                "explanationVi": "render ... obsolete = make ... outdated (khiến cái gì trở nên lỗi thời)."
            }
        ]
    },
    {
        "id": "rd_a06",
        "code": "A06",
        "title": "Assisted Evolution and the Race to Save Coral Reefs",
        "topic": "Environment & Marine Science",
        "paragraphs": [
            "Coral reefs cover less than one percent of the ocean floor, yet they sustain roughly a quarter of all marine species. Unfortunately, successive marine heatwaves have triggered severe bleaching events, causing corals to expel the symbiotic algae that supply both their colour and most of their energy.",
            "In response, marine biologists are trialling a controversial intervention known as assisted evolution. Rather than waiting centuries for natural selection to act, scientists cross-breed heat-tolerant coral colonies from warmer lagoons with vulnerable reef populations and cultivate the resilient offspring in underwater nurseries. Early field deployments along the Great Barrier Reef indicate that selectively bred larvae survive elevated water temperatures markedly better than wild controls.",
            "Critics nevertheless warn that laboratory-reared corals cannot replace comprehensive climate action. Introducing genetically narrowed stock risks reducing natural diversity and could inadvertently heighten vulnerability to novel pathogens. Most ecologists agree that reef restoration buys precious breathing space, but long-term survival still hinges on curbing global greenhouse gas emissions."
        ],
        "highlights": [
            {"phrase": "bleaching events", "meaningVi": "hiện tượng tẩy trắng san hô", "ipa": "/ˈbliːtʃɪŋ ɪˈvents/"},
            {"phrase": "symbiotic", "meaningVi": "cộng sinh", "ipa": "/ˌsɪmbaɪˈɒtɪk/"},
            {"phrase": "assisted evolution", "meaningVi": "tiến hóa có hỗ trợ", "ipa": "/əˈsɪstɪd ˌiːvəˈluːʃn/"},
            {"phrase": "heat-tolerant", "meaningVi": "chịu nhiệt tốt", "ipa": "/ˈhiːt ˌtɒlərənt/"},
            {"phrase": "resilient", "meaningVi": "kiên cường, có sức chống chịu", "ipa": "/rɪˈzɪliənt/"},
            {"phrase": "inadvertently", "meaningVi": "vô tình, không cố ý", "ipa": "/ˌɪnədˈvɜːtəntli/"},
            {"phrase": "pathogens", "meaningVi": "mầm bệnh", "ipa": "/ˈpæθədʒənz/"},
            {"phrase": "hinges on", "meaningVi": "phụ thuộc hoàn toàn vào", "ipa": "/ˈhɪndʒɪz ɒn/"}
        ],
        "tfngQuestions": [
            {
                "id": "a06_tf1",
                "statement": "Coral reefs occupy a tiny fraction of the seabed while supporting a disproportionately large share of ocean life.",
                "answer": "TRUE",
                "evidenceQuote": "Coral reefs cover less than one percent of the ocean floor, yet they sustain roughly a quarter of all marine species.",
                "explanationVi": "Đúng: chiếm chưa đến 1% đáy biển nhưng nuôi dưỡng khoảng 1/4 tổng số loài sinh vật biển."
            },
            {
                "id": "a06_tf2",
                "statement": "Selectively bred coral larvae showed lower survival rates in warm water than wild corals.",
                "answer": "FALSE",
                "evidenceQuote": "selectively bred larvae survive elevated water temperatures markedly better than wild controls.",
                "explanationVi": "Sai: ấu trùng san hô lai chọn lọc sống sót tốt hơn rõ rệt (markedly better) trong nước ấm so với nhóm đối chứng tự nhiên."
            },
            {
                "id": "a06_tf3",
                "statement": "Assisted evolution programmes are currently cheaper to operate than traditional coastal fishing bans.",
                "answer": "NOT GIVEN",
                "evidenceQuote": "marine biologists are trialling a controversial intervention known as assisted evolution.",
                "explanationVi": "Bài không đề cập đến chi phí vận hành hay so sánh với lệnh cấm đánh bắt cá ven bờ."
            },
            {
                "id": "a06_tf4",
                "statement": "Some experts fear that narrowing coral genetic diversity could make reefs more susceptible to new diseases.",
                "answer": "TRUE",
                "evidenceQuote": "Introducing genetically narrowed stock risks reducing natural diversity and could inadvertently heighten vulnerability to novel pathogens.",
                "explanationVi": "Đúng: novel pathogens = new diseases (mầm bệnh mới); heighten vulnerability = make more susceptible."
            }
        ],
        "paraphraseTargets": [
            {
                "id": "a06_p1",
                "questionPhrase": "approximately twenty-five percent of ocean wildlife",
                "targetInPassage": "roughly a quarter of all marine species",
                "distractors": ["less than one percent", "warmer lagoons", "wild controls"],
                "explanationVi": "roughly a quarter = approximately 25%; marine species = ocean wildlife."
            },
            {
                "id": "a06_p2",
                "questionPhrase": "accidentally increase susceptibility to new diseases",
                "targetInPassage": "inadvertently heighten vulnerability to novel pathogens",
                "distractors": ["expel the symbiotic algae", "cultivate the resilient offspring", "buys precious breathing space"],
                "explanationVi": "inadvertently = accidentally; heighten vulnerability = increase susceptibility; novel pathogens = new diseases."
            },
            {
                "id": "a06_p3",
                "questionPhrase": "provides valuable extra time",
                "targetInPassage": "buys precious breathing space",
                "distractors": ["wait centuries", "curbing global greenhouse gas emissions", "early field deployments"],
                "explanationVi": "buy breathing space = tranh thủ thêm thời gian quý báu."
            },
            {
                "id": "a06_p4",
                "questionPhrase": "depends crucially upon cutting emissions",
                "targetInPassage": "hinges on curbing global greenhouse gas emissions",
                "distractors": ["comprehensive climate action", "natural selection", "elevated water temperatures"],
                "explanationVi": "hinge on = depend crucially upon; curb = cut/limit."
            }
        ]
    }
]


PASSAGES_DATA.extend([
    {
        "id": "rd_a07",
        "code": "A07",
        "title": "Sleep Deprivation and the Hidden Cost to Cognitive Agility",
        "topic": "Health & Neuroscience",
        "paragraphs": [
            "Modern work cultures frequently glorify long hours and minimal rest, yet neuroscientists warn that chronic sleep deprivation silently erodes human judgement. Even losing ninety minutes of sleep per night over a single working week impairs prefrontal cortex activity, diminishing memory consolidation, emotional regulation, and creative problem-solving.",
            "Alarmingly, sleep-deprived individuals are notoriously poor judges of their own decline. In controlled laboratory experiments, volunteers restricted to six hours of nightly rest reported feeling only mildly fatigued after ten days, even though their reaction times had deteriorated to levels comparable with staying awake for twenty-four hours straight. Caffeine temporarily masks drowsiness by blocking adenosine receptors, but it cannot replicate the cellular repair and metabolic waste clearance that occur exclusively during deep slow-wave sleep.",
            "Public health researchers argue that treating rest as a personal indulgence rather than a biological necessity carries steep economic costs. Organisations that discourage late-night emails and schedule flexible shift rotations consistently report fewer safety incidents, stronger decision accuracy, and lower long-term burnout."
        ],
        "highlights": [
            {"phrase": "sleep deprivation", "meaningVi": "tình trạng thiếu ngủ", "ipa": "/sliːp ˌdeprɪˈveɪʃn/"},
            {"phrase": "erodes", "meaningVi": "làm xói mòn, suy giảm dần", "ipa": "/ɪˈrəʊdz/"},
            {"phrase": "impairs", "meaningVi": "làm suy yếu, tổn hại", "ipa": "/ɪmˈpeəz/"},
            {"phrase": "memory consolidation", "meaningVi": "quá trình củng cố trí nhớ", "ipa": "/ˈmeməri kənˌsɒlɪˈdeɪʃn/"},
            {"phrase": "notoriously", "meaningVi": "khét tiếng, nổi tiếng theo nghĩa xấu", "ipa": "/nəʊˈtɔːriəsli/"},
            {"phrase": "deteriorated", "meaningVi": "suy giảm, xấu đi rõ rệt", "ipa": "/dɪˈtɪəriəreɪtɪd/"},
            {"phrase": "masks", "meaningVi": "che lấp tạm thời", "ipa": "/mɑːsks/"},
            {"phrase": "indulgence", "meaningVi": "sự nuông chiều bản thân", "ipa": "/ɪnˈdʌldʒəns/"}
        ],
        "tfngQuestions": [
            {
                "id": "a07_tf1",
                "statement": "People who regularly sleep only six hours a night accurately recognise how severely their reaction speed has dropped.",
                "answer": "FALSE",
                "evidenceQuote": "volunteers restricted to six hours of nightly rest reported feeling only mildly fatigued after ten days, even though their reaction times had deteriorated to levels comparable with staying awake for twenty-four hours straight.",
                "explanationVi": "Sai: người thiếu ngủ đánh giá rất kém sự suy giảm của chính mình, chỉ thấy hơi mệt dù tốc độ phản xạ đã giảm nặng."
            },
            {
                "id": "a07_tf2",
                "statement": "Caffeine hides feelings of sleepiness but does not perform the restorative biological work of deep sleep.",
                "answer": "TRUE",
                "evidenceQuote": "Caffeine temporarily masks drowsiness by blocking adenosine receptors, but it cannot replicate the cellular repair and metabolic waste clearance that occur exclusively during deep slow-wave sleep.",
                "explanationVi": "Đúng: caffeine chỉ che lấp cơn buồn ngủ (masks drowsiness), không thay thế được quá trình phục hồi tế bào trong giấc ngủ sâu."
            },
            {
                "id": "a07_tf3",
                "statement": "Older adults require significantly more slow-wave sleep each night than university-aged students.",
                "answer": "NOT GIVEN",
                "evidenceQuote": "metabolic waste clearance that occur exclusively during deep slow-wave sleep.",
                "explanationVi": "Bài đọc không so sánh nhu cầu giấc ngủ sâu giữa người lớn tuổi và sinh viên."
            },
            {
                "id": "a07_tf4",
                "statement": "Companies that curb after-hours messaging tend to experience better workplace safety records.",
                "answer": "TRUE",
                "evidenceQuote": "Organisations that discourage late-night emails and schedule flexible shift rotations consistently report fewer safety incidents",
                "explanationVi": "Đúng: discourage late-night emails = hạn chế nhắn tin/email ngoài giờ; fewer safety incidents = an toàn lao động tốt hơn."
            }
        ],
        "paraphraseTargets": [
            {
                "id": "a07_p1",
                "questionPhrase": "gradually weakens decision-making ability",
                "targetInPassage": "silently erodes human judgement",
                "distractors": ["minimal rest", "emotional regulation", "flexible shift rotations"],
                "explanationVi": "erode = gradually weaken (làm xói mòn); human judgement = decision-making ability."
            },
            {
                "id": "a07_p2",
                "questionPhrase": "worsened to a degree similar to",
                "targetInPassage": "deteriorated to levels comparable with",
                "distractors": ["mildly fatigued", "biological necessity", "steep economic costs"],
                "explanationVi": "deteriorate = worsen; comparable with = similar to."
            },
            {
                "id": "a07_p3",
                "questionPhrase": "hides tiredness for a short period",
                "targetInPassage": "temporarily masks drowsiness",
                "distractors": ["cellular repair", "personal indulgence", "lower long-term burnout"],
                "explanationVi": "temporarily = for a short period; mask = hide; drowsiness = tiredness/sleepiness."
            },
            {
                "id": "a07_p4",
                "questionPhrase": "incurs heavy financial consequences",
                "targetInPassage": "carries steep economic costs",
                "distractors": ["discourage late-night emails", "controlled laboratory experiments", "stronger decision accuracy"],
                "explanationVi": "carry steep economic costs = incur heavy financial consequences."
            }
        ]
    },
    {
        "id": "rd_a08",
        "code": "A08",
        "title": "Vertical Farming in Megacities: Promise and Practical Constraints",
        "topic": "Urban Planning & Agriculture",
        "paragraphs": [
            "As urban populations swell and unpredictable droughts disrupt open-field harvests, vertical farming has attracted billions in venture capital. Inside converted warehouses, stacked trays of leafy greens grow under tuned LED lighting using closed-loop hydroponic systems that consume up to ninety-five percent less water than conventional agriculture while eliminating chemical runoff.",
            "Because produce is harvested just kilometres from supermarkets, vertical farms slash refrigerated freight emissions and guarantee year-round supply regardless of seasonal storms. Leafy crops such as basil, spinach, and lettuce thrive in these sterile enclosures, delivering crisp textures and remarkably long shelf lives without synthetic pesticides.",
            "Yet steep electricity bills remain the sector's Achilles' heel. Replicating natural sunlight artificially demands substantial power, making energy-intensive staple crops like wheat, rice, and maize economically unviable indoors. Until grids transition overwhelmingly to cheap renewable energy, agronomists view vertical farms not as a replacement for broadacre farmland, but as a resilient complement supplying fresh greens to dense metropolitan hubs."
        ],
        "highlights": [
            {"phrase": "hydroponic", "meaningVi": "thủy canh", "ipa": "/ˌhaɪdrəˈpɒnɪk/"},
            {"phrase": "runoff", "meaningVi": "dòng chảy tràn mang hóa chất", "ipa": "/ˈrʌnɒf/"},
            {"phrase": "freight", "meaningVi": "vận chuyển hàng hóa", "ipa": "/freɪt/"},
            {"phrase": "sterile", "meaningVi": "vô trùng, sạch khuẩn", "ipa": "/ˈsteraɪl/"},
            {"phrase": "synthetic", "meaningVi": "tổng hợp, nhân tạo", "ipa": "/sɪnˈθetɪk/"},
            {"phrase": "Achilles' heel", "meaningVi": "điểm yếu chí tử (gót chân Asin)", "ipa": "/əˌkɪliːz ˈhiːl/"},
            {"phrase": "staple crops", "meaningVi": "cây lương thực thiết yếu", "ipa": "/ˈsteɪpl krɒps/"},
            {"phrase": "unviable", "meaningVi": "không khả thi về mặt kinh tế", "ipa": "/ʌnˈvaɪəbl/"}
        ],
        "tfngQuestions": [
            {
                "id": "a08_tf1",
                "statement": "Closed-loop indoor hydroponic farms require dramatically less water than traditional outdoor farming.",
                "answer": "TRUE",
                "evidenceQuote": "closed-loop hydroponic systems that consume up to ninety-five percent less water than conventional agriculture",
                "explanationVi": "Đúng: tiêu thụ ít hơn tới 95% lượng nước so với nông nghiệp truyền thống."
            },
            {
                "id": "a08_tf2",
                "statement": "Vertical farms can currently grow staple grains such as wheat and rice at a lower cost than open fields.",
                "answer": "FALSE",
                "evidenceQuote": "making energy-intensive staple crops like wheat, rice, and maize economically unviable indoors.",
                "explanationVi": "Sai: chi phí điện quá cao khiến việc trồng lúa mì, gạo, ngô trong nhà không khả thi về mặt kinh tế (economically unviable)."
            },
            {
                "id": "a08_tf3",
                "statement": "Singapore currently operates more commercial vertical farms than any other Asian city.",
                "answer": "NOT GIVEN",
                "evidenceQuote": "supplying fresh greens to dense metropolitan hubs.",
                "explanationVi": "Bài đọc nhắc đến các đô thị đông đúc nói chung, không hề đề cập đến Singapore."
            },
            {
                "id": "a08_tf4",
                "statement": "Agronomists generally expect vertical farming to supplement rather than fully replace traditional farmland.",
                "answer": "TRUE",
                "evidenceQuote": "agronomists view vertical farms not as a replacement for broadacre farmland, but as a resilient complement",
                "explanationVi": "Đúng: coi nông trại thẳng đứng là phần bổ sung bền vững (resilient complement) chứ không thay thế hoàn toàn đất nông nghiệp truyền thống."
            }
        ],
        "paraphraseTargets": [
            {
                "id": "a08_p1",
                "questionPhrase": "drastically cut transport pollution",
                "targetInPassage": "slash refrigerated freight emissions",
                "distractors": ["eliminating chemical runoff", "year-round supply", "converted warehouses"],
                "explanationVi": "slash = drastically cut; freight emissions = transport pollution."
            },
            {
                "id": "a08_p2",
                "questionPhrase": "the industry's most serious weakness",
                "targetInPassage": "the sector's Achilles' heel",
                "distractors": ["venture capital", "resilient complement", "sterile enclosures"],
                "explanationVi": "Achilles' heel là thành ngữ học thuật chỉ điểm yếu nghiêm trọng nhất."
            },
            {
                "id": "a08_p3",
                "questionPhrase": "not financially practical",
                "targetInPassage": "economically unviable",
                "distractors": ["energy-intensive", "broadacre farmland", "tuned LED lighting"],
                "explanationVi": "economically unviable = not financially practical/feasible."
            },
            {
                "id": "a08_p4",
                "questionPhrase": "basic food grains",
                "targetInPassage": "staple crops",
                "distractors": ["leafy greens", "synthetic pesticides", "seasonal storms"],
                "explanationVi": "staple crops = cây lương thực chủ yếu như lúa mì, lúa gạo, ngô."
            }
        ]
    },
    {
        "id": "rd_a09",
        "code": "A09",
        "title": "Unravelling Fast Fashion: Can Circular Textiles Scale Up?",
        "topic": "Economy & Sustainability",
        "paragraphs": [
            "Over the past two decades, global clothing production has roughly doubled while the average number of times a garment is worn before being discarded has plummeted. Fast-fashion retailers accelerate turnover through rapid micro-seasons, enticing shoppers with rock-bottom prices made possible by synthetic polyester fibres and tightly squeezed overseas supply chains.",
            "This linear take-make-waste model carries an immense ecological toll. Textile dyeing contaminates freshwater rivers, synthetic garments shed microfibres during every wash, and less than one percent of discarded apparel is currently recycled into new clothing. Most donated garments are downcycled into insulation rags or exported to overstretched markets in developing economies.",
            "Transitioning toward a circular textile economy requires redesigning apparel from the outset. Chemical recycling plants can now separate blended cotton-polyester fabrics into virgin-quality fibres, yet operating costs remain far higher than producing fresh petroleum-based yarn. Economists therefore contend that voluntary brand pledges will fall short unless governments enact extended producer responsibility laws that tax disposable overproduction and reward repairable, durable design."
        ],
        "highlights": [
            {"phrase": "plummeted", "meaningVi": "giảm mạnh đột ngột", "ipa": "/ˈplʌmɪtɪd/"},
            {"phrase": "enticing", "meaningVi": "lôi cuốn, dụ dỗ", "ipa": "/ɪnˈtaɪsɪŋ/"},
            {"phrase": "ecological toll", "meaningVi": "cái giá phải trả về mặt sinh thái", "ipa": "/ˌiːkəˈlɒdʒɪkl təʊl/"},
            {"phrase": "contaminates", "meaningVi": "làm ô nhiễm", "ipa": "/kənˈtæmɪneɪts/"},
            {"phrase": "downcycled", "meaningVi": "tái chế hạ cấp (thành sản phẩm giá trị thấp hơn)", "ipa": "/ˈdaʊnsaɪkld/"},
            {"phrase": "circular", "meaningVi": "tuần hoàn", "ipa": "/ˈsɜːkjələ(r)/"},
            {"phrase": "pledges", "meaningVi": "cam kết, lời hứa", "ipa": "/ˈpledʒɪz/"},
            {"phrase": "enact", "meaningVi": "ban hành (luật)", "ipa": "/ɪˈnækt/"}
        ],
        "tfngQuestions": [
            {
                "id": "a09_tf1",
                "statement": "People today tend to wear each item of clothing fewer times before throwing it away than they did twenty years ago.",
                "answer": "TRUE",
                "evidenceQuote": "the average number of times a garment is worn before being discarded has plummeted.",
                "explanationVi": "Đúng: số lần mặc trung bình trước khi bỏ đi đã giảm mạnh (plummeted)."
            },
            {
                "id": "a09_tf2",
                "statement": "Roughly half of all discarded garments are currently recycled back into new clothes.",
                "answer": "FALSE",
                "evidenceQuote": "less than one percent of discarded apparel is currently recycled into new clothing.",
                "explanationVi": "Sai: chưa đến 1% (less than one percent) quần áo bỏ đi được tái chế thành quần áo mới."
            },
            {
                "id": "a09_tf3",
                "statement": "European fashion brands have already agreed to eliminate synthetic polyester entirely by 2035.",
                "answer": "NOT GIVEN",
                "evidenceQuote": "voluntary brand pledges will fall short unless governments enact extended producer responsibility laws",
                "explanationVi": "Bài không đề cập đến thỏa thuận của các hãng châu Âu hay mốc năm 2035."
            },
            {
                "id": "a09_tf4",
                "statement": "Economists believe legal regulation is needed because voluntary corporate promises alone are insufficient.",
                "answer": "TRUE",
                "evidenceQuote": "Economists therefore contend that voluntary brand pledges will fall short unless governments enact extended producer responsibility laws",
                "explanationVi": "Đúng: voluntary brand pledges will fall short = cam kết tự nguyện là chưa đủ; cần luật trách nhiệm nhà sản xuất."
            }
        ],
        "paraphraseTargets": [
            {
                "id": "a09_p1",
                "questionPhrase": "dropped dramatically",
                "targetInPassage": "has plummeted",
                "distractors": ["roughly doubled", "accelerate turnover", "fall short"],
                "explanationVi": "plummet = drop dramatically (giảm lao dốc)."
            },
            {
                "id": "a09_p2",
                "questionPhrase": "severe environmental damage",
                "targetInPassage": "immense ecological toll",
                "distractors": ["rock-bottom prices", "rapid micro-seasons", "virgin-quality fibres"],
                "explanationVi": "immense ecological toll = cái giá/tổn thất sinh thái khổng lồ."
            },
            {
                "id": "a09_p3",
                "questionPhrase": "pollutes clean river systems",
                "targetInPassage": "contaminates freshwater rivers",
                "distractors": ["shed microfibres", "overstretched markets", "insulation rags"],
                "explanationVi": "contaminate = pollute (làm ô nhiễm)."
            },
            {
                "id": "a09_p4",
                "questionPhrase": "pass binding legislation",
                "targetInPassage": "enact extended producer responsibility laws",
                "distractors": ["voluntary brand pledges", "chemical recycling plants", "disposable overproduction"],
                "explanationVi": "enact ... laws = pass legislation (ban hành luật)."
            }
        ]
    },
    {
        "id": "rd_a10",
        "code": "A10",
        "title": "Bilingualism, Executive Control, and Lifelong Brain Plasticity",
        "topic": "Education & Linguistics",
        "paragraphs": [
            "During the early twentieth century, many educators mistakenly assumed that raising children with two languages would cause mental confusion and delay academic progress. Modern neuroimaging has decisively overturned that assumption, revealing that juggling two linguistic systems continuously exercises the brain's executive control network.",
            "Whenever a fluent bilingual speaks, both languages remain simultaneously active in the mind. Selecting the appropriate vocabulary while inhibiting interference from the non-target language strengthens attentional switching and working memory. Although bilingual toddlers sometimes display slightly smaller single-language vocabularies initially, their combined conceptual knowledge matches monolingual peers and their early gap soon disappears.",
            "Even more striking are findings from clinical neurology. Several large hospital cohorts suggest that lifelong active bilinguals experience the onset of dementia symptoms roughly four to five years later than monolinguals with comparable levels of brain pathology. Researchers emphasise that bilingualism does not prevent physical ageing of the brain, but instead builds cognitive reserve—allowing neural pathways to compensate effectively when damage accumulates."
        ],
        "highlights": [
            {"phrase": "overturned", "meaningVi": "lật ngược, bác bỏ hoàn toàn", "ipa": "/ˌəʊvəˈtɜːnd/"},
            {"phrase": "executive control", "meaningVi": "chức năng điều hành (của não bộ)", "ipa": "/ɪɡˈzekjətɪv kənˈtrəʊl/"},
            {"phrase": "simultaneously", "meaningVi": "đồng thời, cùng lúc", "ipa": "/ˌsɪmlˈteɪniəsli/"},
            {"phrase": "inhibiting", "meaningVi": "ức chế, ngăn chặn", "ipa": "/ɪnˈhɪbɪtɪŋ/"},
            {"phrase": "monolingual", "meaningVi": "đơn ngữ (chỉ dùng một ngôn ngữ)", "ipa": "/ˌmɒnəˈlɪŋɡwəl/"},
            {"phrase": "onset", "meaningVi": "sự khởi phát (bệnh tật)", "ipa": "/ˈɒnset/"},
            {"phrase": "pathology", "meaningVi": "bệnh lý, tổn thương bệnh học", "ipa": "/pəˈθɒlədʒi/"},
            {"phrase": "cognitive reserve", "meaningVi": "dự trữ nhận thức", "ipa": "/ˈkɒɡnətɪv rɪˈzɜːv/"}
        ],
        "tfngQuestions": [
            {
                "id": "a10_tf1",
                "statement": "Early twentieth-century educators widely believed that bilingual upbringing boosted children's academic clarity.",
                "answer": "FALSE",
                "evidenceQuote": "During the early twentieth century, many educators mistakenly assumed that raising children with two languages would cause mental confusion and delay academic progress.",
                "explanationVi": "Sai: trước đây nhiều nhà giáo dục lầm tưởng song ngữ gây rối loạn tư duy và làm chậm tiến độ học tập."
            },
            {
                "id": "a10_tf2",
                "statement": "When a bilingual person speaks one language, the other language completely shuts down in the brain.",
                "answer": "FALSE",
                "evidenceQuote": "Whenever a fluent bilingual speaks, both languages remain simultaneously active in the mind.",
                "explanationVi": "Sai: cả hai ngôn ngữ vẫn đồng thời hoạt động (simultaneously active) trong não."
            },
            {
                "id": "a10_tf3",
                "statement": "Learning a third language in middle age produces twice the dementia delay of lifelong bilingualism.",
                "answer": "NOT GIVEN",
                "evidenceQuote": "lifelong active bilinguals experience the onset of dementia symptoms roughly four to five years later than monolinguals",
                "explanationVi": "Bài chỉ so sánh người song ngữ trọn đời và người đơn ngữ, không nói gì về ngôn ngữ thứ ba."
            },
            {
                "id": "a10_tf4",
                "statement": "Bilingualism helps delay clinical dementia symptoms by helping the brain work around physical damage.",
                "answer": "TRUE",
                "evidenceQuote": "bilingualism does not prevent physical ageing of the brain, but instead builds cognitive reserve—allowing neural pathways to compensate effectively when damage accumulates.",
                "explanationVi": "Đúng: song ngữ tạo ra dự trữ nhận thức (cognitive reserve) giúp mạng nơ-ron bù trừ hiệu quả."
            }
        ],
        "paraphraseTargets": [
            {
                "id": "a10_p1",
                "questionPhrase": "conclusively disproved that belief",
                "targetInPassage": "decisively overturned that assumption",
                "distractors": ["delay academic progress", "mental confusion", "comparable levels"],
                "explanationVi": "decisively overturned = conclusively disproved (bác bỏ dứt khoát); assumption = belief."
            },
            {
                "id": "a10_p2",
                "questionPhrase": "suppressing distraction from the other language",
                "targetInPassage": "inhibiting interference from the non-target language",
                "distractors": ["combined conceptual knowledge", "attentional switching", "modern neuroimaging"],
                "explanationVi": "inhibit = suppress (ức chế); interference = distraction/can nhiễu."
            },
            {
                "id": "a10_p3",
                "questionPhrase": "the initial appearance of memory-loss signs",
                "targetInPassage": "the onset of dementia symptoms",
                "distractors": ["physical ageing", "clinical neurology", "working memory"],
                "explanationVi": "onset = initial appearance/start (sự khởi phát)."
            },
            {
                "id": "a10_p4",
                "questionPhrase": "adapt to offset accumulating harm",
                "targetInPassage": "compensate effectively when damage accumulates",
                "distractors": ["prevent physical ageing", "early gap soon disappears", "hospital cohorts"],
                "explanationVi": "compensate = offset/adapt to make up for (bù trừ)."
            }
        ]
    },
    {
        "id": "rd_a11",
        "code": "A11",
        "title": "Microplastics in Freshwater Systems: Tracking an Invisible Pollutant",
        "topic": "Science & Environment",
        "paragraphs": [
            "Although oceanic garbage patches dominate public attention, freshwater ecologists stress that rivers and lakes act as both major conduits and long-term sinks for microplastics. Fragments smaller than five millimetres enter waterways primarily through tyre abrasion washed off highways, synthetic laundry effluent, and disintegrating agricultural mulch films.",
            "Because their size closely resembles natural plankton, microplastics are readily ingested by freshwater invertebrates and juvenile fish. Laboratory assays demonstrate that trapped particles can induce false satiation, reducing nutrient intake and slowing larval growth. Furthermore, plastic surfaces behave like chemical magnets, adsorbing persistent heavy metals and industrial pesticides from polluted river water before transferring those toxins up the aquatic food web.",
            "Filtering microscopic debris from entire river basins is practically impossible once dispersal occurs. Consequently, environmental engineers focus on upstream interception: installing fine-mesh filters inside domestic washing machines, constructing vegetated stormwater basins along motorways to trap tyre dust, and phasing out single-use packaging before fragments ever reach a tributary."
        ],
        "highlights": [
            {"phrase": "conduits", "meaningVi": "đường dẫn, kênh vận chuyển", "ipa": "/ˈkɒndjuɪts/"},
            {"phrase": "abrasion", "meaningVi": "sự mài mòn", "ipa": "/əˈbreɪʒn/"},
            {"phrase": "effluent", "meaningVi": "nước thải công nghiệp/sinh hoạt", "ipa": "/ˈefluənt/"},
            {"phrase": "ingested", "meaningVi": "bị nuốt phải, hấp thụ qua tiêu hóa", "ipa": "/ɪnˈdʒestɪd/"},
            {"phrase": "satiation", "meaningVi": "cảm giác no", "ipa": "/ˌseɪʃiˈeɪʃn/"},
            {"phrase": "persistent", "meaningVi": "tồn lưu dai dẳng (trong môi trường)", "ipa": "/pəˈsɪstənt/"},
            {"phrase": "dispersal", "meaningVi": "sự phát tán", "ipa": "/dɪˈspɜːsl/"},
            {"phrase": "interception", "meaningVi": "sự chặn bắt ngay từ nguồn", "ipa": "/ˌɪntəˈsepʃn/"}
        ],
        "tfngQuestions": [
            {
                "id": "a11_tf1",
                "statement": "Car tyre wear and washing synthetic clothes are key sources of microplastics entering freshwater systems.",
                "answer": "TRUE",
                "evidenceQuote": "Fragments smaller than five millimetres enter waterways primarily through tyre abrasion washed off highways, synthetic laundry effluent, and disintegrating agricultural mulch films.",
                "explanationVi": "Đúng: tyre abrasion = mài mòn lốp xe; synthetic laundry effluent = nước thải giặt vải tổng hợp."
            },
            {
                "id": "a11_tf2",
                "statement": "Swallowing microplastics helps young fish absorb extra nutrients from polluted river water.",
                "answer": "FALSE",
                "evidenceQuote": "trapped particles can induce false satiation, reducing nutrient intake and slowing larval growth.",
                "explanationVi": "Sai: vi nhựa gây cảm giác no giả (false satiation), làm GIẢM hấp thụ dinh dưỡng và chậm lớn."
            },
            {
                "id": "a11_tf3",
                "statement": "France was the first country to mandate microfibre filters in all newly manufactured washing machines.",
                "answer": "NOT GIVEN",
                "evidenceQuote": "installing fine-mesh filters inside domestic washing machines",
                "explanationVi": "Bài có nhắc giải pháp lắp lưới lọc trong máy giặt nhưng không hề nhắc đến nước Pháp hay quy định quốc gia cụ thể."
            },
            {
                "id": "a11_tf4",
                "statement": "Engineers prefer stopping microplastics near their source because removing them after they spread through rivers is unfeasible.",
                "answer": "TRUE",
                "evidenceQuote": "Filtering microscopic debris from entire river basins is practically impossible once dispersal occurs. Consequently, environmental engineers focus on upstream interception",
                "explanationVi": "Đúng: lọc toàn lưu vực sau khi phát tán là bất khả thi, nên kỹ sư tập trung chặn từ đầu nguồn (upstream interception)."
            }
        ],
        "paraphraseTargets": [
            {
                "id": "a11_p1",
                "questionPhrase": "easily swallowed by small aquatic creatures",
                "targetInPassage": "readily ingested by freshwater invertebrates",
                "distractors": ["oceanic garbage patches", "long-term sinks", "industrial pesticides"],
                "explanationVi": "readily = easily; ingested = swallowed (nuốt vào)."
            },
            {
                "id": "a11_p2",
                "questionPhrase": "trigger a misleading feeling of fullness",
                "targetInPassage": "induce false satiation",
                "distractors": ["slowing larval growth", "chemical magnets", "tyre abrasion"],
                "explanationVi": "induce = trigger/cause; false satiation = misleading feeling of fullness (cảm giác no giả)."
            },
            {
                "id": "a11_p3",
                "questionPhrase": "long-lasting toxic elements",
                "targetInPassage": "persistent heavy metals",
                "distractors": ["fine-mesh filters", "natural plankton", "agricultural mulch films"],
                "explanationVi": "persistent = long-lasting / khó phân hủy."
            },
            {
                "id": "a11_p4",
                "questionPhrase": "capturing pollutants at the source",
                "targetInPassage": "upstream interception",
                "distractors": ["entire river basins", "single-use packaging", "aquatic food web"],
                "explanationVi": "upstream interception = chặn bắt ngay tại thượng nguồn/điểm phát sinh."
            }
        ]
    },
    {
        "id": "rd_a12",
        "code": "A12",
        "title": "Autonomous Vehicles: Congestion Cure or Catalyst for Urban Sprawl?",
        "topic": "Technology & Urban Transport",
        "paragraphs": [
            "Proponents of autonomous vehicles long promised that self-driving fleets would banish traffic jams, slash accident fatalities, and free up vast downtown parking lots for parks and affordable housing. Because computer-guided cars can travel safely at tighter spacing and coordinate smoothly at intersections, engineers calculate that existing motorways could carry substantially more vehicles per hour.",
            "Transport planners, however, highlight an overlooked paradox known as induced demand. If commuters can sleep, read, or answer emails effortlessly inside private driverless cars, the perceived cost of long daily journeys plummets. Many households would likely relocate to cheaper, distant suburbs, accelerating urban sprawl and actually multiplying total vehicle kilometres travelled. Empty 'zero-occupancy' cars cruising city blocks to avoid parking fees could worsen peak congestion even further.",
            "Ultimately, technology alone will not determine whether driverless mobility improves urban liveability. Cities that integrate autonomous shuttles into high-capacity rail corridors and price single-occupant road space stand to reclaim greener streets; those that treat self-driving cars merely as chauffeured private sedans risk locking in heavier gridlock for decades."
        ],
        "highlights": [
            {"phrase": "proponents", "meaningVi": "những người ủng hộ", "ipa": "/prəˈpəʊnənts/"},
            {"phrase": "fatalities", "meaningVi": "số ca tử vong (do tai nạn)", "ipa": "/fəˈtælətiz/"},
            {"phrase": "paradox", "meaningVi": "nghịch lý", "ipa": "/ˈpærədɒks/"},
            {"phrase": "induced demand", "meaningVi": "nhu cầu phát sinh thêm (khi hạ tầng thuận tiện hơn)", "ipa": "/ɪnˈdjuːst dɪˈmɑːnd/"},
            {"phrase": "urban sprawl", "meaningVi": "sự mở rộng đô thị tràn lan", "ipa": "/ˈɜːbən sprɔːl/"},
            {"phrase": "liveability", "meaningVi": "chất lượng đáng sống (của đô thị)", "ipa": "/ˌlɪvəˈbɪləti/"},
            {"phrase": "reclaim", "meaningVi": "giành lại, khôi phục (không gian)", "ipa": "/rɪˈkleɪm/"},
            {"phrase": "gridlock", "meaningVi": "tắc nghẽn giao thông tê liệt", "ipa": "/ˈɡrɪdlɒk/"}
        ],
        "tfngQuestions": [
            {
                "id": "a12_tf1",
                "statement": "Engineers estimate that coordinated self-driving cars could increase the hourly capacity of current highways.",
                "answer": "TRUE",
                "evidenceQuote": "engineers calculate that existing motorways could carry substantially more vehicles per hour.",
                "explanationVi": "Đúng: nhờ giữ khoảng cách hẹp an toàn và phối hợp mượt tại giao lộ, cao tốc hiện hữu có thể chở nhiều xe hơn mỗi giờ."
            },
            {
                "id": "a12_tf2",
                "statement": "Transport planners believe driverless cars are guaranteed to reduce total distance driven across cities.",
                "answer": "FALSE",
                "evidenceQuote": "Many households would likely relocate to cheaper, distant suburbs, accelerating urban sprawl and actually multiplying total vehicle kilometres travelled.",
                "explanationVi": "Sai: quy hoạch gia cảnh báo tổng số km di chuyển thậm chí có thể tăng gấp bội (multiplying) do người dân dọn ra ngoại ô xa."
            },
            {
                "id": "a12_tf3",
                "statement": "Insurance premiums for fully autonomous taxis have already fallen by forty percent in California.",
                "answer": "NOT GIVEN",
                "evidenceQuote": "slash accident fatalities, and free up vast downtown parking lots",
                "explanationVi": "Bài không đề cập đến phí bảo hiểm hay bang California."
            },
            {
                "id": "a12_tf4",
                "statement": "The author concludes that urban policy choices will shape whether autonomous vehicles relieve or worsen traffic.",
                "answer": "TRUE",
                "evidenceQuote": "Ultimately, technology alone will not determine whether driverless mobility improves urban liveability.",
                "explanationVi": "Đúng: công nghệ đơn lẻ không quyết định được, mà phụ thuộc vào cách thành phố kết hợp xe tự lái với đường sắt và thu phí đường."
            }
        ],
        "paraphraseTargets": [
            {
                "id": "a12_p1",
                "questionPhrase": "dramatically cut road deaths",
                "targetInPassage": "slash accident fatalities",
                "distractors": ["banish traffic jams", "tighter spacing", "parking fees"],
                "explanationVi": "slash = dramatically cut; accident fatalities = road deaths."
            },
            {
                "id": "a12_p2",
                "questionPhrase": "speeding up outward city expansion",
                "targetInPassage": "accelerating urban sprawl",
                "distractors": ["overlooked paradox", "distant suburbs", "high-capacity rail corridors"],
                "explanationVi": "accelerate = speed up; urban sprawl = outward city expansion."
            },
            {
                "id": "a12_p3",
                "questionPhrase": "driverless cars circling with no passengers",
                "targetInPassage": "Empty 'zero-occupancy' cars cruising city blocks",
                "distractors": ["chauffeured private sedans", "existing motorways", "single-occupant road space"],
                "explanationVi": "zero-occupancy cars = xe không có hành khách; cruising = chạy vòng quanh."
            },
            {
                "id": "a12_p4",
                "questionPhrase": "entrenching severe traffic paralysis",
                "targetInPassage": "locking in heavier gridlock",
                "distractors": ["reclaim greener streets", "perceived cost", "affordable housing"],
                "explanationVi": "lock in = entrench; heavier gridlock = severe traffic paralysis."
            }
        ]
    },
])


def build_reading_passages(anki_decks: dict[str, list[dict]]) -> list[dict]:
    # Enrich A01-A05 highlights from live Anki notes whenever available
    anki_article_vocab: dict[str, dict[str, tuple[str, str]]] = {}
    for dname, notes in anki_decks.items():
        if "8. Bài báo học thuật" in dname:
            m = re.search(r"(A0\d)", dname)
            if not m:
                continue
            code = m.group(1)
            vocab_map = anki_article_vocab.setdefault(code, {})
            for note in notes:
                fields = note["fields"]
                if len(fields) >= 4:
                    w = fields[0].strip().lower()
                    ipa = fields[1].strip()
                    meaning = fields[3].strip()
                    vocab_map[w] = (meaning, ipa)

    passages: list[dict] = []
    for p in PASSAGES_DATA:
        entry = {
            "id": p["id"],
            "code": p["code"],
            "title": p["title"],
            "topic": p["topic"],
            "paragraphs": p["paragraphs"],
            "highlights": [],
            "tfngQuestions": p["tfngQuestions"],
            "paraphraseTargets": p["paraphraseTargets"],
        }
        code_map = anki_article_vocab.get(p["code"], {})
        for h in p["highlights"]:
            key = h["phrase"].lower()
            if key in code_map:
                anki_meaning, anki_ipa = code_map[key]
                entry["highlights"].append(
                    {
                        "phrase": h["phrase"],
                        "meaningVi": anki_meaning or h["meaningVi"],
                        "ipa": anki_ipa or h.get("ipa", ""),
                    }
                )
            else:
                entry["highlights"].append(h)
        passages.append(entry)
    return passages


# ==============================================================================
# SECTION 3: READING/LISTENING PARAPHRASES (>= 150 pairs)
# ==============================================================================

ANKI_PARAPHRASE_DISTRACTORS: dict[str, tuple[list[str], str]] = {
    "old people": (["adolescents", "commuters", "undergraduates"], "Đề thường dùng 'old people' nhưng bài đọc/nghe sẽ chuyển sang 'senior citizens', 'the elderly' hoặc 'older adults'."),
    "children": (["pensioners", "employees", "investors"], "Trong IELTS, 'children' hay được paraphrase thành 'minors', 'youngsters' hoặc 'the younger generation'."),
    "increase": (["plummet", "stagnate", "fluctuate"], "Động từ 'increase' thường được nâng cấp thành 'surge', 'soar', 'climb' hoặc danh từ hóa thành 'a rise in'."),
    "decrease": (["escalate", "double", "stabilise"], "Đề dùng 'decrease', bài thường đổi thành 'decline', 'drop', 'plummet' hoặc 'a downward trend'."),
    "reduce": (["amplify", "trigger", "expand"], "'reduce' thường được thay bằng 'curb', 'cut', 'diminish' hoặc 'lower' trong chủ đề môi trường và chính sách."),
    "important": (["trivial", "optional", "temporary"], "Tính từ 'important' rất hay xuất hiện dưới dạng 'crucial', 'vital', 'essential' hoặc 'a key element'."),
    "use": (["abandon", "prohibit", "postpone"], "Động từ 'use' thường được học thuật hóa thành 'utilise', 'employ' hoặc 'apply'."),
    "help": (["hinder", "obstruct", "discourage"], "'help' trong câu hỏi hay được paraphrase trong bài thành 'assist', 'support' hoặc 'facilitate'."),
    "need": (["reject", "replace", "avoid"], "'need' thường xuất hiện trong bài học thuật dưới dạng 'require', 'demand' hoặc 'call for'."),
    "show": (["conceal", "contradict", "ignore"], "'research shows' rất hay đổi thành 'findings indicate', 'demonstrate' hoặc 'reveal'."),
    "cause": (["prevent", "relieve", "offset"], "Quan hệ nhân quả 'cause' thường được thay bằng 'lead to', 'trigger', 'give rise to' hoặc 'result in'."),
    "because of": (["despite", "instead of", "apart from"], "Cụm giới từ 'because of' hay chuyển thành 'owing to', 'due to' hoặc 'on account of'."),
    "dangerous": (["harmless", "beneficial", "affordable"], "Trong bài khoa học/an toàn, 'dangerous' thường được thay bằng 'hazardous', 'risky' hoặc 'harmful'."),
    "difficult": (["effortless", "convenient", "straightforward"], "'difficult' thường đổi sang 'demanding', 'challenging' hoặc 'arduous'."),
    "enough": (["excessive", "scarce", "redundant"], "'enough' được thay bằng 'sufficient' hoặc 'adequate' (phủ định: 'insufficient' / 'inadequate')."),
    "about / around": (["precisely", "rarely", "exceeding"], "Số liệu xấp xỉ 'about/around' trong đề thường thành 'roughly', 'approximately' hoặc 'in the region of'."),
    "government": (["consumers", "volunteers", "journalists"], "'government' hay được paraphrase thành 'the authorities', 'policymakers' hoặc 'officials'."),
    "money": (["labour", "equipment", "legislation"], "'money' trong ngữ cảnh dự án/trường học thường đổi thành 'funding', 'finance' hoặc 'budget'."),
    "job": (["qualification", "leisure", "commute"], "'job' được nâng cấp thành 'employment', 'occupation', 'profession' hoặc 'role'."),
    "company": (["charity", "ministry", "municipality"], "'company' hay xuất hiện trong bài đọc kinh tế dưới dạng 'firm', 'enterprise' hoặc 'corporation'."),
    "expensive": (["affordable", "economical", "subsidised"], "'expensive' thường được thay bằng 'costly', 'pricey' hoặc 'prohibitively expensive'."),
    "cheap": (["costly", "luxurious", "scarce"], "'cheap' trong IELTS hay được diễn đạt lịch sự hơn là 'affordable', 'inexpensive' hoặc 'low-cost'."),
    "start": (["halt", "postpone", "withdraw"], "'start a project' thường đổi thành 'launch a scheme', 'initiate' hoặc 'establish'."),
    "stop": (["initiate", "accelerate", "sustain"], "'stop' hay chuyển thành 'halt', 'cease', 'discontinue' hoặc 'put an end to'."),
    "change": (["preserve", "maintain", "freeze"], "'change' được paraphrase linh hoạt thành 'modify', 'alter', 'transform' hoặc 'adapt'."),
    "problem": (["remedy", "breakthrough", "incentive"], "'problem' trong đề hay thành 'challenge', 'obstacle', 'issue' hoặc 'drawback' trong bài."),
    "advantage": (["drawback", "liability", "constraint"], "'advantage' thường đổi sang 'benefit', 'merit', 'upside' hoặc 'strength'."),
    "disadvantage": (["merit", "incentive", "dividend"], "'disadvantage' thường xuất hiện dưới dạng 'drawback', 'downside' hoặc 'limitation'."),
    "researcher": (["participant", "legislator", "entrepreneur"], "'researchers' rất hay đổi thành 'investigators', 'academics', 'scientists' hoặc 'the team'."),
    "prove": (["dispute", "speculate", "overlook"], "'prove' trong nghiên cứu hay được paraphrase thành 'confirm', 'establish' hoặc 'verify'."),
    "not sure": (["convinced", "confirmed", "unanimous"], "'not sure' thường được viết học thuật hơn là 'remains unclear', 'uncertain' hoặc 'debatable'."),
    "many": (["scarce", "isolated", "negligible"], "'many' trong câu hỏi thường đổi thành 'numerous', 'countless' hoặc 'a large number of'."),
    "most": (["a handful of", "a small fraction of", "hardly any"], "'most' hay chuyển thành 'the majority of' hoặc 'the bulk of'."),
    "only a few": (["the vast majority of", "nearly all", "countless"], "'only a few' thường được diễn đạt thành 'a handful of' hoặc 'a small minority'."),
    "at first": (["eventually", "subsequently", "ultimately"], "'at first' gần như luôn được paraphrase thành 'initially', 'originally' hoặc 'in the early stages'."),
    "now": (["formerly", "historically", "eventually"], "'now' trong đề bài thường đổi sang 'currently', 'at present' hoặc 'nowadays'."),
    "in the past": (["currently", "shortly", "prospectively"], "'in the past' thường chuyển thành 'previously', 'formerly' hoặc 'historically'."),
    "happen": (["prevent", "cease", "resolve"], "'happen' hay được học thuật hóa thành 'occur', 'take place' hoặc 'arise'."),
    "try": (["abandon", "neglect", "accomplish"], "'try to' trong đề thường đổi thành 'attempt to', 'seek to' hoặc 'endeavour to'."),
    "think": (["confirm", "measure", "refute"], "'experts think' hay đổi thành 'specialists argue', 'maintain' hoặc 'hold the view'."),
}

EXTRA_PARAPHRASES: list[tuple[str, str, str, str, list[str], str]] = [
    # (original, paraphrased, meaningVi, contextSentence, distractors, explanationVi)
    ("get rid of", "eliminate", "loại bỏ hoàn toàn", "Đề: get rid of plastic waste → Bài: eliminate single-use plastics.", ["accumulate", "preserve", "import"], "eliminate là động từ học thuật tương đương get rid of / remove completely."),
    ("run out of", "exhaust", "cạn kiệt (tài nguyên)", "Đề: run out of fossil fuels → Bài: exhaust non-renewable reserves.", ["replenish", "conserve", "extract"], "exhaust resources = làm cạn kiệt nguồn tài nguyên."),
    ("go back to", "revert to", "quay trở lại (trạng thái cũ)", "Đề: go back to paper tickets → Bài: revert to printed passes.", ["upgrade to", "depart from", "adapt to"], "revert to thường dùng trong Reading/Listening khi quay lại cách làm cũ."),
    ("deal with", "address", "giải quyết, xử lý", "Đề: deal with housing shortages → Bài: address the lack of affordable homes.", ["aggravate", "ignore", "postpone"], "address a problem/issue = tackle / deal with a problem."),
    ("find out", "ascertain", "tìm hiểu, xác minh", "Đề: find out the cause → Bài: ascertain the root cause of the fault.", ["assume", "conceal", "dismiss"], "ascertain mang sắc thái trang trọng hơn của find out / determine."),
    ("make worse", "exacerbate", "làm trầm trọng thêm", "Đề: make traffic worse → Bài: exacerbate peak-hour congestion.", ["alleviate", "stabilise", "resolve"], "exacerbate = aggravate = make an existing problem worse."),
    ("make better", "alleviate", "làm dịu bớt, cải thiện", "Đề: make symptoms better → Bài: alleviate chronic discomfort.", ["intensify", "trigger", "prolong"], "alleviate thường đi với pain, poverty, congestion, symptoms."),
    ("speed up", "accelerate", "đẩy nhanh, tăng tốc", "Đề: speed up recovery → Bài: accelerate economic recovery.", ["impede", "halt", "postpone"], "accelerate = speed up (cả nghĩa vật lý lẫn kinh tế/xã hội)."),
    ("slow down", "impede", "cản trở, làm chậm lại", "Đề: slow down innovation → Bài: impede technological progress.", ["foster", "expedite", "stimulate"], "impede / hinder = làm chậm lại, cản trở tiến độ."),
    ("encourage", "foster", "thúc đẩy, nuôi dưỡng", "Đề: encourage creativity → Bài: foster creative thinking among pupils.", ["suppress", "deter", "restrict"], "foster collocate tự nhiên với innovation, collaboration, growth."),
    ("ban", "prohibit", "cấm đoán", "Đề: ban smoking indoors → Bài: prohibit tobacco use in enclosed spaces.", ["permit", "subsidise", "endorse"], "prohibit / outlaw = ban chính thức bằng quy định hoặc pháp luật."),
    ("allow", "permit", "cho phép", "Đề: allow visitors to take photos → Bài: permit photography without flash.", ["forbid", "penalise", "suspend"], "permit là cách diễn đạt trang trọng của allow trong biển báo và quy định."),
    ("keep", "retain", "giữ lại, duy trì", "Đề: keep experienced staff → Bài: retain skilled employees.", ["dismiss", "discard", "replace"], "retain rất hay xuất hiện trong Reading chủ đề nhân sự, trí nhớ và độ ẩm."),
    ("throw away", "discard", "vứt bỏ", "Đề: throw away old electronics → Bài: discard obsolete devices.", ["salvage", "refurbish", "preserve"], "discard = throw away / dispose of."),
    ("buy", "purchase", "mua sắm", "Đề: buy tickets online → Bài: purchase passes via the digital portal.", ["refund", "lease", "manufacture"], "purchase là từ paraphrase kinh điển của buy trong Listening Section 1–2."),
    ("sell", "retail", "bán lẻ", "Đề: sell goods directly → Bài: retail products straight to consumers.", ["acquire", "import", "consume"], "retail (v) = bán lẻ trực tiếp cho người tiêu dùng."),
    ("build", "construct", "xây dựng", "Đề: build a new bridge → Bài: construct a suspension crossing.", ["demolish", "abandon", "relocate"], "construct / erect thường thay cho build trong mô tả bản đồ và kiến trúc."),
    ("knock down", "demolish", "phá dỡ (công trình)", "Đề: knock down the old factory → Bài: demolish the disused mill.", ["renovate", "expand", "preserve"], "demolish / tear down là cặp paraphrase bắt buộc cho bài Map."),
    ("improve a building", "renovate", "cải tạo, tu sửa", "Đề: improve the old theatre → Bài: renovate the historic auditorium.", ["demolish", "neglect", "relocate"], "renovate / refurbish = tân trang, sửa chữa công trình cũ."),
    ("move to another place", "relocate", "di dời địa điểm", "Đề: move the clinic → Bài: relocate the medical centre to the east wing.", ["expand", "shut down", "preserve"], "relocate xuất hiện rất thường xuyên trong Listening Map & Reading đô thị."),
    ("grow in size", "expand", "mở rộng quy mô", "Đề: the campus grew → Bài: the university expanded its northern site.", ["shrink", "merge", "cease"], "expand = grow in size / extend."),
    ("get smaller", "shrink", "thu hẹp, co lại", "Đề: habitats are getting smaller → Bài: natural habitats are shrinking rapidly.", ["flourish", "broaden", "double"], "shrink / contract = thu nhỏ lại về diện tích hoặc quy mô."),
    ("predict", "forecast", "dự báo", "Đề: predict future demand → Bài: forecast long-term electricity demand.", ["recall", "verify", "dispute"], "forecast / project dùng cho thời tiết, kinh tế và xu hướng tương lai."),
    ("check", "verify", "kiểm chứng, xác thực", "Đề: check the identity → Bài: verify the applicant's credentials.", ["fabricate", "overlook", "assume"], "verify = check the accuracy or truth of something."),
    ("explain", "clarify", "làm rõ, giải thích", "Đề: explain the policy → Bài: clarify the updated refund terms.", ["obscure", "complicate", "conceal"], "clarify = make something easier to understand."),
    ("hide", "conceal", "che giấu", "Đề: hide the real cost → Bài: conceal hidden administrative fees.", ["disclose", "reveal", "highlight"], "conceal / obscure trái nghĩa với reveal / disclose."),
    ("tell the public", "disclose", "tiết lộ, công bố", "Đề: tell customers about data use → Bài: disclose how personal data is shared.", ["withhold", "conceal", "censor"], "disclose thường đi với information, findings, risks."),
    ("depend on", "rely on", "phụ thuộc vào", "Đề: depend on imported oil → Bài: rely heavily on foreign fuel supplies.", ["dispense with", "object to", "diverge from"], "rely on / hinge on là cách paraphrase phổ biến của depend on."),
    ("agree with", "endorse", "tán thành, ủng hộ", "Đề: experts agree with the plan → Bài: specialists publicly endorse the proposal.", ["oppose", "critique", "repeal"], "endorse mang nghĩa ủng hộ công khai một kế hoạch hoặc sản phẩm."),
    ("disagree with", "challenge", "phản bác, đặt nghi vấn", "Đề: scientists disagree with the claim → Bài: researchers challenge the assumption.", ["confirm", "validate", "adopt"], "challenge a claim/theory = đặt nghi vấn, phản bác lập luận."),
    ("criticise", "condemn", "chỉ trích mạnh mẽ, lên án", "Đề: groups criticised the decision → Bài: campaigners condemned the ruling.", ["praise", "approve", "subsidise"], "condemn mạnh hơn criticise, thường dùng trong bài báo học thuật."),
    ("praise", "commend", "khen ngợi, tán dương", "Đề: judges praised the design → Bài: the panel commended the innovative layout.", ["reprimand", "dismiss", "fault"], "commend = praise formally (khen ngợi trang trọng)."),
    ("give money to help", "subsidise", "trợ cấp tài chính", "Đề: government pays part of rail fares → Bài: state funding subsidises commuter rail.", ["tax", "penalise", "privatise"], "subsidise = hỗ trợ tài chính để giảm giá thành cho người dân/doanh nghiệp."),
    ("punish financially", "penalise", "xử phạt (tài chính/quy định)", "Đề: fine polluting factories → Bài: penalise firms that exceed emission caps.", ["reward", "exempt", "compensate"], "penalise = impose a penalty on."),
    ("make up for", "compensate for", "bù đắp cho", "Đề: make up for lost revenue → Bài: compensate for declining ticket sales.", ["aggravate", "forfeit", "neglect"], "compensate for / offset = bù đắp tổn thất."),
    ("copy", "replicate", "tái lập, sao chép (thí nghiệm)", "Đề: copy the experiment → Bài: replicate the clinical trial independently.", ["invalidate", "abandon", "alter"], "replicate rất phổ biến trong Reading khoa học khi lặp lại thí nghiệm."),
    ("get", "obtain", "thu được, đạt được", "Đề: get permission first → Bài: obtain prior written consent.", ["surrender", "forfeit", "withhold"], "obtain / acquire là từ học thuật thay cho get."),
    ("give", "provide", "cung cấp", "Đề: give free meals → Bài: provide complimentary lunches to delegates.", ["deprive", "withhold", "consume"], "provide / supply / furnish thường thay cho give."),
    ("share out", "allocate", "phân bổ (nguồn lực/ngân sách)", "Đề: share out the budget → Bài: allocate funds across regional hospitals.", ["hoard", "deplete", "withdraw"], "allocate resources/funding là collocation Band 8.0 chuẩn."),
    ("use up", "consume", "tiêu thụ", "Đề: use up too much power → Bài: consume excessive electricity.", ["generate", "conserve", "store"], "consume dùng cho năng lượng, thực phẩm và tài nguyên."),
    ("save", "conserve", "bảo tồn, tiết kiệm (tài nguyên)", "Đề: save water in summer → Bài: conserve freshwater reserves during droughts.", ["squander", "deplete", "pollute"], "conserve khác với save money; conserve dùng cho năng lượng, thiên nhiên, di sản."),
    ("waste", "squander", "lãng phí (tiền bạc/cơ hội)", "Đề: waste public money → Bài: squander taxpayer funds on unused venues.", ["invest", "conserve", "accumulate"], "squander = waste carelessly (lãng phí một cách vô ích)."),
    ("protect", "safeguard", "bảo vệ an toàn", "Đề: protect endangered birds → Bài: safeguard vulnerable wetland species.", ["jeopardise", "exploit", "neglect"], "safeguard / preserve = bảo vệ khỏi nguy cơ tổn hại."),
    ("put in danger", "jeopardise", "đặt vào tình thế nguy hiểm", "Đề: put the project in danger → Bài: jeopardise the long-term viability of the scheme.", ["bolster", "secure", "stabilise"], "jeopardise / threaten = gây nguy hại cho sự thành công hay an toàn."),
    ("damage", "impair", "làm suy yếu, tổn hại chức năng", "Đề: damage hearing → Bài: impair long-term auditory sensitivity.", ["enhance", "restore", "fortify"], "impair hay đi với vision, hearing, memory, judgement."),
    ("harm", "detrimental to", "gây hại cho", "Đề: harm marine life → Bài: prove detrimental to coastal ecosystems.", ["conducive to", "beneficial to", "indifferent to"], "be detrimental to = be harmful to (tính từ Band 8.0)."),
    ("helpful for", "conducive to", "tạo điều kiện thuận lợi cho", "Đề: helpful for studying → Bài: a quiet atmosphere conducive to concentration.", ["hostile to", "detrimental to", "irrelevant to"], "conducive to = tạo môi trường thuận lợi cho việc gì xảy ra."),
    ("very big", "immense", "khổng lồ, to lớn", "Đề: a very big impact → Bài: an immense economic transformation.", ["negligible", "marginal", "trivial"], "immense / vast / colossal thay cho very big."),
    ("very small", "negligible", "không đáng kể", "Đề: a very small difference → Bài: a negligible gap between the two groups.", ["substantial", "dramatic", "pronounced"], "negligible = quá nhỏ nên gần như không ảnh hưởng."),
    ("very important", "paramount", "tối quan trọng", "Đề: safety is very important → Bài: passenger safety is of paramount importance.", ["secondary", "trivial", "optional"], "of paramount importance = quan trọng hàng đầu."),
    ("not important", "trivial", "tầm thường, nhỏ nhặt", "Đề: a minor, unimportant detail → Bài: a trivial administrative oversight.", ["pivotal", "vital", "crucial"], "trivial = of little value or importance."),
    ("very clear", "evident", "rõ ràng, hiển nhiên", "Đề: it is very clear that → Bài: it is readily evident from the data.", ["ambiguous", "obscure", "dubious"], "evident / apparent / unmistakable = rõ ràng."),
    ("unclear", "ambiguous", "mơ hồ, nhiều cách hiểu", "Đề: unclear instructions → Bài: ambiguous wording in the contract.", ["explicit", "precise", "unambiguous"], "ambiguous = có thể hiểu theo nhiều nghĩa khác nhau."),
    ("surprising", "unanticipated", "bất ngờ, ngoài dự kiến", "Đề: a surprising outcome → Bài: an unanticipated surge in enrolments.", ["predictable", "routine", "expected"], "unanticipated / unforeseen = không lường trước được."),
    ("expected", "predictable", "có thể dự đoán trước", "Đề: an expected reaction → Bài: a predictable seasonal decline.", ["erratic", "spontaneous", "bizarre"], "predictable trái nghĩa với erratic / unpredictable."),
    ("unusual", "unprecedented", "chưa từng có tiền lệ", "Đề: unusually high heat → Bài: unprecedented summer temperatures.", ["customary", "conventional", "ordinary"], "unprecedented = chưa từng xảy ra trước đây trong lịch sử."),
    ("normal / traditional", "conventional", "truyền thống, thông thường", "Đề: normal farming → Bài: conventional open-field agriculture.", ["radical", "experimental", "novel"], "conventional đối lập với innovative / alternative / experimental."),
    ("new", "novel", "mới lạ, độc đáo", "Đề: a new method → Bài: a novel approach to battery recycling.", ["outdated", "archaic", "familiar"], "novel (adj) trong Reading nghĩa là mới mẻ và sáng tạo, không phải tiểu thuyết!"),
    ("old-fashioned", "obsolete", "lỗi thời, không còn dùng nữa", "Đề: old-fashioned tools → Bài: equipment rendered obsolete by automation.", ["cutting-edge", "modern", "contemporary"], "obsolete = lỗi thời vì đã có thứ mới hơn thay thế."),
    ("modern / latest", "cutting-edge", "tiên tiến nhất", "Đề: the latest medical devices → Bài: cutting-edge diagnostic imaging.", ["obsolete", "rudimentary", "antiquated"], "cutting-edge / state-of-the-art = công nghệ tân tiến bậc nhất."),
    ("basic / simple", "rudimentary", "sơ khai, cơ bản ban đầu", "Đề: basic stone tools → Bài: rudimentary agricultural implements.", ["sophisticated", "intricate", "elaborate"], "rudimentary hay gặp trong bài khảo cổ và lịch sử công nghệ."),
    ("complex / advanced", "sophisticated", "tinh vi, phức tạp", "Đề: advanced tracking software → Bài: sophisticated satellite telemetry.", ["primitive", "simplistic", "crude"], "sophisticated mô tả hệ thống, công nghệ hoặc lập luận tinh vi."),
    ("likely to happen", "inevitable", "không thể tránh khỏi", "Đề: change is bound to happen → Bài: structural shifts appear inevitable.", ["improbable", "avoidable", "unlikely"], "inevitable = chắc chắn sẽ xảy ra, không tránh khỏi."),
    ("possible to do", "viable", "khả thi, có thể tồn tại", "Đề: a practical alternative → Bài: an economically viable renewable option.", ["unfeasible", "futile", "impractical"], "viable / feasible = có khả năng triển khai thành công trong thực tế."),
    ("impossible / pointless", "futile", "vô ích, không mang lại kết quả", "Đề: pointless efforts → Bài: a futile attempt to halt coastal erosion.", ["fruitful", "productive", "effective"], "futile = incapable of producing any useful result."),
    ("rich / wealthy", "affluent", "giàu có, sung túc", "Đề: wealthy neighbourhoods → Bài: affluent suburban districts.", ["impoverished", "deprived", "destitute"], "affluent đối lập với impoverished / low-income."),
    ("poor", "impoverished", "nghèo khó, thiếu thốn", "Đề: poor rural communities → Bài: impoverished agricultural regions.", ["prosperous", "affluent", "privileged"], "impoverished / underprivileged là cách diễn đạt học thuật của poor."),
    ("fair / equal", "equitable", "công bằng, bình đẳng", "Đề: fair access to healthcare → Bài: equitable distribution of medical services.", ["biased", "disproportionate", "arbitrary"], "equitable = fair and impartial."),
    ("unfair", "biased", "thiên vị, không khách quan", "Đề: an unfair sample → Bài: a heavily biased online survey.", ["impartial", "objective", "neutral"], "biased trái nghĩa với objective / impartial."),
    ("strict", "stringent", "nghiêm ngặt, khắt khe", "Đề: strict safety rules → Bài: stringent environmental regulations.", ["lenient", "lax", "permissive"], "stringent collocate cực tốt với regulations, standards, criteria."),
    ("relaxed / not strict", "lenient", "khoan dung, lỏng lẻo", "Đề: light punishments → Bài: lenient sentencing for first-time offenders.", ["stringent", "harsh", "rigid"], "lenient = ít khắt khe hơn dự kiến (thường dùng trong luật/giáo dục)."),
    ("mandatory / required", "compulsory", "bắt buộc", "Đề: required attendance → Bài: compulsory laboratory induction.", ["voluntary", "optional", "discretionary"], "compulsory / mandatory đối lập với optional / voluntary."),
    ("optional", "voluntary", "tự nguyện, không bắt buộc", "Đề: optional extra sessions → Bài: voluntary peer-mentoring workshops.", ["mandatory", "obligatory", "enforced"], "voluntary = tham gia tự nguyện."),
    ("quick / sudden", "abrupt", "đột ngột, bất thình lình", "Đề: a sudden stop → Bài: an abrupt termination of funding.", ["gradual", "steady", "prolonged"], "abrupt = sudden and unexpected."),
    ("slow and steady", "gradual", "từ từ, dần dần", "Đề: a slow improvement → Bài: a gradual recovery in fish stocks.", ["abrupt", "drastic", "instant"], "gradual đối lập với abrupt / sudden / drastic."),
    ("lasting a short time", "transient", "tạm thời, thoáng qua", "Đề: short-lived economic boost → Bài: a transient spike in tourist spending.", ["permanent", "enduring", "perpetual"], "transient / temporary đối lập với lasting / permanent."),
    ("lasting a long time", "enduring", "lâu dài, bền bỉ", "Đề: lasting cultural influence → Bài: an enduring architectural legacy.", ["fleeting", "brief", "ephemeral"], "enduring = continuing for a very long time."),
    ("everywhere", "ubiquitous", "có mặt ở khắp mọi nơi", "Đề: smartphones are everywhere → Bài: mobile devices have become ubiquitous.", ["scarce", "rare", "localised"], "ubiquitous = omnipresent = phổ biến khắp nơi."),
    ("very common", "prevalent", "thịnh hành, phổ biến", "Đề: a common misconception → Bài: a prevalent belief among consumers.", ["rare", "uncommon", "exceptional"], "prevalent thường dùng cho bệnh tật, quan niệm, hiện tượng xã hội."),
    ("very rare", "scarce", "khan hiếm", "Đề: clean water is rare → Bài: potable water remains scarce in arid zones.", ["abundant", "plentiful", "ample"], "scarce đối lập với abundant / plentiful."),
    ("plenty of", "abundant", "dồi dào, phong phú", "Đề: plenty of sunlight → Bài: abundant solar radiation throughout summer.", ["scarce", "meagre", "insufficient"], "abundant = existing in large quantities."),
    ("only in one place", "localised", "cục bộ, giới hạn ở một vùng", "Đề: flooding only in one district → Bài: localised flash flooding near the coast.", ["widespread", "global", "universal"], "localised đối lập với widespread / nationwide."),
    ("people living in a place", "residents", "cư dân địa phương", "Đề: people who live nearby → Bài: local residents opposed the night flights.", ["tourists", "commuters", "visitors"], "residents / inhabitants thường thay cho people living in the area."),
    ("people walking", "pedestrians", "người đi bộ", "Đề: safer streets for walkers → Bài: wider crossings for pedestrians.", ["motorists", "passengers", "cyclists"], "pedestrians là từ bắt buộc cho Listening/Reading về giao thông."),
    ("car drivers", "motorists", "người lái ô tô", "Đề: drivers face higher tolls → Bài: motorists must pay a congestion charge.", ["pedestrians", "tenants", "spectators"], "motorists thay cho car drivers trong văn bản quy hoạch giao thông."),
    ("people travelling to work", "commuters", "người đi làm hằng ngày", "Đề: workers taking the train → Bài: daily rail commuters from the suburbs.", ["tourists", "retirees", "expatriates"], "commuters = người đi làm/đi học di chuyển đều đặn mỗi ngày."),
    ("shoppers / buyers", "consumers", "người tiêu dùng", "Đề: shoppers choose eco labels → Bài: environmentally conscious consumers.", ["suppliers", "regulators", "shareholders"], "consumers dùng rộng trong kinh tế và tiếp thị."),
    ("workers / staff", "workforce", "lực lượng lao động", "Đề: training all staff → Bài: upskilling an ageing workforce.", ["management", "clientele", "electorate"], "workforce / personnel = toàn thể nhân viên hoặc lực lượng lao động."),
    ("people taking part", "participants", "người tham gia (nghiên cứu/sự kiện)", "Đề: people in the study → Bài: survey participants aged 18 to 65.", ["observers", "evaluators", "sponsors"], "participants / respondents thay cho people in the study/survey."),
    ("native people / species", "indigenous", "bản địa", "Đề: native plant species → Bài: indigenous flora adapted to poor soils.", ["invasive", "imported", "exotic"], "indigenous / native đối lập với non-native / invasive."),
    ("foreign / harmful species", "invasive", "xâm lấn (sinh vật ngoại lai)", "Đề: harmful foreign weeds → Bài: invasive plant species crowding out native grass.", ["endemic", "native", "indigenous"], "invasive species là thuật ngữ quen thuộc trong Reading sinh học."),
    ("farming", "agriculture", "nông nghiệp", "Đề: modern farming methods → Bài: intensive commercial agriculture.", ["manufacturing", "forestry", "mining"], "agriculture / cultivation thay cho farming."),
    ("city areas", "urban centres", "khu vực đô thị", "Đề: big cities → Bài: densely populated urban centres.", ["rural hamlets", "wilderness", "pastures"], "urban / metropolitan đối lập với rural / pastoral."),
    ("countryside", "rural regions", "vùng nông thôn", "Đề: clinics in the countryside → Bài: healthcare access in remote rural regions.", ["metropolitan hubs", "inner cities", "industrial estates"], "rural = thuộc vùng nông thôn."),
    ("weather over decades", "climate", "khí hậu", "Đề: long-term weather shifts → Bài: shifting regional climate patterns.", ["forecast", "humidity", "breeze"], "climate là thời tiết dài hạn; không nhầm với weather ngắn hạn."),
    ("lack of rain", "drought", "hạn hán", "Đề: months without rain → Bài: a prolonged seasonal drought.", ["deluge", "monsoon", "humidity"], "drought = thiếu mưa kéo dài gây khô hạn."),
    ("dirty / polluted", "contaminated", "bị nhiễm bẩn, ô nhiễm", "Đề: polluted groundwater → Bài: aquifers contaminated by industrial runoff.", ["purified", "sterile", "filtered"], "contaminated dùng cho nước, đất, thực phẩm bị nhiễm độc/vi khuẩn."),
    ("clean and safe to drink", "potable", "uống được, đạt chuẩn nước sạch", "Đề: safe drinking water → Bài: access to reliable potable water supplies.", ["saline", "stagnant", "brackish"], "potable water = safe drinking water."),
    ("rubbish / trash", "refuse", "rác thải", "Đề: household rubbish collection → Bài: municipal refuse management.", ["compost", "resource", "commodity"], "refuse (n. /ˈrefjuːs/) = rác thải sinh hoạt."),
    ("energy from sun/wind", "renewables", "năng lượng tái tạo", "Đề: wind and solar power → Bài: rapid investment in renewables.", ["fossil fuels", "petrochemicals", "coal reserves"], "renewables = renewable energy sources."),
    ("illness / disease", "ailment", "chứng bệnh, bệnh lý", "Đề: minor health problems → Bài: common respiratory ailments.", ["remedy", "immunity", "vitality"], "ailment / disorder / malady thường thay cho illness."),
    ("long-lasting disease", "chronic condition", "bệnh mãn tính", "Đề: lifelong health issues → Bài: managing chronic cardiovascular conditions.", ["acute injury", "brief infection", "mild sprain"], "chronic (mãn tính) đối lập với acute (cấp tính)."),
    ("cure / treatment", "remedy", "phương thuốc, biện pháp khắc phục", "Đề: a simple treatment → Bài: an effective dietary remedy.", ["symptom", "diagnosis", "pathogen"], "remedy dùng cho cả y học lẫn giải pháp xã hội."),
    ("prevent illness", "prophylactic", "phòng ngừa (bệnh)", "Đề: preventive medicine → Bài: prophylactic vaccination campaigns.", ["curative", "terminal", "contagious"], "prophylactic / preventive = phòng bệnh hơn chữa bệnh."),
    ("tiredness", "fatigue", "sự mệt mỏi, kiệt sức", "Đề: feeling very tired → Bài: acute mental fatigue among shift workers.", ["vigour", "alertness", "stamina"], "fatigue là từ học thuật chuẩn cho tiredness."),
    ("eating habits", "dietary intake", "chế độ ăn / lượng nạp dinh dưỡng", "Đề: what people eat daily → Bài: participants' overall dietary intake.", ["metabolic rate", "physical exertion", "sleep hygiene"], "dietary intake / nutrition thay cho eating habits."),
    ("yearly", "annual", "hằng năm", "Đề: once a year → Bài: the university's annual sustainability audit.", ["quarterly", "biennial", "monthly"], "annual = yearly; lưu ý biennial = 2 năm một lần."),
    ("every two years", "biennial", "hai năm một lần", "Đề: held every two years → Bài: a biennial international architecture summit.", ["annual", "monthly", "weekly"], "biennial = mỗi 2 năm (bẫy nghe/đọc rất hay gặp ở Section 2–3)."),
    ("happening at the same time", "simultaneous", "đồng thời", "Đề: two events at the same time → Bài: simultaneous translations across six halls.", ["consecutive", "delayed", "isolated"], "simultaneous = concurrent = diễn ra cùng lúc."),
    ("one after another", "consecutive", "liên tiếp", "Đề: three years in a row → Bài: three consecutive years of record heat.", ["intermittent", "simultaneous", "sporadic"], "consecutive = in a row (liên tục không ngắt quãng)."),
    ("stopping and starting", "intermittent", "ngắt quãng, không liên tục", "Đề: power goes on and off → Bài: intermittent wind electricity generation.", ["continuous", "uninterrupted", "constant"], "intermittent rất phổ biến trong bài năng lượng gió/mặt trời."),
    ("by accident", "inadvertently", "vô tình, không cố ý", "Đề: accidentally deleted data → Bài: inadvertently erased crucial files.", ["deliberately", "intentionally", "purposely"], "inadvertently = accidentally = unintentionally."),
    ("on purpose", "deliberately", "cố ý, có chủ đích", "Đề: designed on purpose → Bài: deliberately engineered to resist corrosion.", ["accidentally", "inadvertently", "randomly"], "deliberately = intentionally."),
    ("nearly / almost", "virtually", "gần như hoàn toàn", "Đề: almost zero emissions → Bài: virtually carbon-neutral operations.", ["barely", "partly", "scarcely"], "virtually = nearly / practically."),
    ("mostly / mainly", "predominantly", "chủ yếu, phần lớn", "Đề: mainly young adults → Bài: a workforce composed predominantly of graduates.", ["rarely", "marginally", "exclusively"], "predominantly = mainly / largely."),
    ("only / purely", "exclusively", "độc quyền, chỉ dành riêng", "Đề: only for members → Bài: facilities reserved exclusively for subscribers.", ["broadly", "partly", "commonly"], "exclusively là từ khóa cực nhạy trong câu hỏi TFNG!"),
    ("partly", "to a certain extent", "ở một mức độ nào đó", "Đề: partly responsible → Bài: responsible to a certain extent for the delay.", ["entirely", "solely", "altogether"], "to a certain extent / partially = một phần, không tuyệt đối."),
    ("despite", "notwithstanding", "mặc dù, bất chấp", "Đề: despite high costs → Bài: notwithstanding steep upfront expenses.", ["because of", "owing to", "in light of"], "notwithstanding = in spite of / despite (văn phong học thuật cao)."),
    ("as a result", "consequently", "hệ quả là, do đó", "Đề: so fewer people drove → Bài: consequently, inner-city traffic fell.", ["nevertheless", "conversely", "meanwhile"], "consequently / accordingly diễn tả kết quả trực tiếp."),
    ("on the opposite side", "conversely", "ngược lại", "Đề: on the other hand → Bài: conversely, rural birth rates continued to dip.", ["similarly", "moreover", "therefore"], "conversely dùng để nêu chiều hướng hoàn toàn ngược lại."),
]


def build_paraphrases(anki_decks: dict[str, list[dict]]) -> list[dict]:
    items: list[dict] = []
    seen: set[str] = set()
    idx = 1

    anki_notes = []
    for dname, notes in anki_decks.items():
        if "3. Paraphrase" in dname:
            anki_notes.extend(notes)

    for note in anki_notes:
        fields = note["fields"]
        if len(fields) < 8:
            continue
        original = fields[0].strip()
        meaning_vi = fields[3].strip()
        context = fields[6].strip()
        syns = [s.strip() for s in re.split(r"[·;]+", fields[7]) if s.strip()]
        if not original or not syns or original.lower() in seen:
            continue
        paraphrased = " / ".join(syns[:3])
        distractors, expl = ANKI_PARAPHRASE_DISTRACTORS.get(
            original,
            (
                ["unrelated term", "opposite concept", "informal slang"],
                f"Trong IELTS Listening/Reading, '{original}' thường được paraphrase thành {paraphrased}.",
            ),
        )
        items.append(
            {
                "id": f"para_{idx:03d}",
                "original": original,
                "paraphrased": paraphrased,
                "meaningVi": meaning_vi,
                "contextSentence": context or f"Đề: {original} → Bài: {syns[0]}",
                "distractors": distractors,
                "explanationVi": expl,
            }
        )
        seen.add(original.lower())
        idx += 1

    for original, paraphrased, meaning_vi, context, distractors, expl in EXTRA_PARAPHRASES:
        if original.lower() in seen:
            continue
        items.append(
            {
                "id": f"para_{idx:03d}",
                "original": original,
                "paraphrased": paraphrased,
                "meaningVi": meaning_vi,
                "contextSentence": context,
                "distractors": distractors,
                "explanationVi": expl,
            }
        )
        seen.add(original.lower())
        idx += 1

    return items


# ==============================================================================
# SECTION 4: WRITING UPGRADES (>= 140 items: Task 1 & Task 2)
# ==============================================================================

# Map exact cleaned Band 8 sentence from Anki -> (taskType, category, band6Sentence, targetChunk, distractors, explanationVi)
ANKI_WRITING_UPGRADE_MAP: dict[str, tuple[str, str, str, str, list[str], str]] = {
    # 2. Collocation (2 notes)
    "Governments should allocate more funding to primary education.": (
        "Task 2", "Academic Collocation",
        "Governments should give more money to primary schools.",
        "allocate more funding",
        ["hand out more cash", "spend bigger money", "put extra finance"],
        "Collocation Band 8.0 'allocate funding to' trang trọng và chính xác hơn 'give money to'."
    ),
    "This trend is likely to have far-reaching implications for society as a whole.": (
        "Task 2", "Academic Collocation",
        "This trend will probably have big effects on everyone in society.",
        "far-reaching implications",
        ["very big results", "huge endings", "long-distance effects"],
        "'have far-reaching implications for' là cụm nâng cấp chuẩn Band 8.0 cho 'have big effects on'."
    ),
    # 5. Writing > Task 1 (30 notes)
    "The number of visitors rose sharply from 2 million to 5 million between 2010 and 2015.": (
        "Task 1", "Trends",
        "The number of visitors went up a lot from 2 million to 5 million in 2010 to 2015.",
        "rose sharply",
        ["went up very big", "grew strongly fast", "raised quickly"],
        "Kết hợp động từ 'rise' (nội động từ, quá khứ rose) + trạng từ 'sharply' chuẩn mô tả xu hướng Task 1."
    ),
    "Sales remained stable at around 400 units for the rest of the period.": (
        "Task 1", "Trends",
        "Sales stayed the same at about 400 units until the end.",
        "remained stable",
        ["kept unmoving", "stayed equal", "held flatly"],
        "'remained stable at' là cụm chuẩn mực thay cho 'stayed the same'."
    ),
    "Unemployment peaked at 12% in 2009 before declining steadily.": (
        "Task 1", "Trends",
        "Unemployment got to the highest point of 12% in 2009 and then went down slowly.",
        "peaked at",
        ["topped in", "reached peak on", "climbed highest at"],
        "Động từ 'peak at + số liệu' ngắn gọn, chính xác hơn 'get to the highest point'."
    ),
    "There was a dramatic fall in the price of solar panels.": (
        "Task 1", "Trends",
        "The price of solar panels went down very fast.",
        "a dramatic fall in",
        ["a dramatic fall of", "a big dropping at", "a sudden decrease about"],
        "Cấu trúc danh từ hóa 'There was a + adj + noun + in' giúp đa dạng ngữ pháp Task 1."
    ),
    "The figure fluctuated between 30% and 40% throughout the decade.": (
        "Task 1", "Trends",
        "The number went up and down between 30% and 40% for ten years.",
        "fluctuated",
        ["shook up and down", "waved around", "moved irregularly"],
        "'fluctuate between X and Y' diễn tả sự dao động chính xác thay cho 'go up and down'."
    ),
    "Car ownership reached a low of 15% in 1990.": (
        "Task 1", "Trends",
        "Car ownership went down to the lowest number of 15% in 1990.",
        "reached a low of",
        ["hit bottom in", "arrived a minimum at", "fell lowest to"],
        "'reach a low of + số liệu' là collocation chuẩn cho điểm đáy biểu đồ."
    ),
    "The figure stood at 45% in 2000.": (
        "Task 1", "Trends",
        "The number was 45% in the year 2000.",
        "stood at",
        ["sat on", "stayed in", "located at"],
        "'stand at' là động từ học thuật tự nhiên để nêu mốc số liệu khởi điểm thay vì lặp 'was'."
    ),
    "Exports more than doubled over the period shown.": (
        "Task 1", "Trends",
        "Exports became more than two times bigger during the chart time.",
        "more than doubled",
        ["over two-timed", "multiplied doubly", "increased twice bigger"],
        "Động từ 'double' kèm trạng ngữ 'more than' giúp diễn đạt bội số cực kỳ súc tích."
    ),
    "The amount of waste recycled nearly tripled between 2000 and 2020.": (
        "Task 1", "Trends",
        "The recycled waste became almost three times more from 2000 to 2020.",
        "nearly tripled",
        ["almost three-folded", "nearly grew triple", "tripled closely"],
        "'nearly tripled' súc tích hơn rất nhiều so với 'became almost three times more'."
    ),
    "The percentage of households with internet access rose steadily, reaching 90% in 2020.": (
        "Task 1", "Complex Sentences",
        "The percentage of households with internet rose steadily. It reached 90% in 2020.",
        ", reaching 90%",
        [", and reached at 90%", ", which reaching 90%", ", to reach at 90%"],
        "Dùng mệnh đề phân từ V-ing (', reaching ...') để gộp hai câu đơn thành câu phức mượt mà."
    ),
    "The two lines converged in 2015, when both stood at 60%.": (
        "Task 1", "Trends",
        "The two lines met at the same point in 2015 at 60%.",
        "converged",
        ["combined together", "collided", "joined up"],
        "'converge' là từ chuyên dụng Band 8.0 chỉ hai đường biểu đồ tiến về cùng một điểm."
    ),
    "Electricity consumption is projected to rise to 300 units by 2030.": (
        "Task 1", "Projections",
        "Electricity use will probably go up to 300 units in 2030.",
        "is projected to",
        ["is guessed to", "will forecast to", "is hoping to"],
        "Khi biểu đồ có mốc tương lai, dùng 'is projected/forecast to + V' thay cho 'will probably'."
    ),
    "Overall, it is clear that coal remained the main source of electricity, while renewables grew the fastest.": (
        "Task 1", "Overview",
        "In general, coal was always the biggest source and renewables grew the most quickly.",
        "Overall, it is clear that",
        ["To sum up, we see", "In conclusion, clearly", "All in all, obviously"],
        "Mở đoạn Overview bằng 'Overall, it is clear that...' giúp nổi bật xu hướng chính cho tiêu chí Task Achievement."
    ),
    "Over the period shown, the most striking feature is the rapid growth of online sales.": (
        "Task 1", "Overview",
        "In the chart time, the biggest thing to notice is online sales grew fast.",
        "the most striking feature",
        ["the strongest point", "the loudest detail", "the most obvious stuff"],
        "'the most striking feature is...' là cấu trúc mở Overview tự nhiên, giàu sắc thái học thuật."
    ),
    "By contrast, the proportion of older workers fell slightly.": (
        "Task 1", "Comparisons",
        "But on the other side, the percentage of older workers dropped a little.",
        "By contrast,",
        ["On the opposite,", "In contrary,", "Opposite to that,"],
        "'By contrast,' (hoặc 'In contrast,') là từ nối đối lập chuẩn xác ở đầu câu."
    ),
    "Meat consumption fell, whereas vegetable consumption increased.": (
        "Task 1", "Comparisons",
        "Meat eating went down, and vegetable eating went up.",
        ", whereas",
        [", however", ", despite", ", although but"],
        "Liên từ 'whereas' nối hai mệnh đề đối lập trong cùng một câu phức chuẩn ngữ pháp."
    ),
    "Spending on healthcare was twice as high as spending on education.": (
        "Task 1", "Comparisons",
        "Healthcare spending was two times bigger than education spending.",
        "twice as high as",
        ["two times higher as", "double higher than", "twice more high than"],
        "Cấu trúc so sánh bội số chuẩn: 'twice / three times as + adj + as'."
    ),
    "The figure for men was slightly higher than that for women.": (
        "Task 1", "Comparisons",
        "The number for men was a bit higher than the number for women.",
        "slightly higher than that for",
        ["a little taller than those for", "slightly more high than it for", "marginally higher than which for"],
        "Dùng đại từ thay thế 'that for' (số ít) tránh lặp từ 'the figure for'."
    ),
    "In comparison with 1990, far fewer people smoked in 2020.": (
        "Task 1", "Comparisons",
        "Compared to 1990, much less people smoked in 2020.",
        "In comparison with",
        ["Comparing against", "In compare to", "With comparing of"],
        "'In comparison with + N' kết hợp 'far fewer + danh từ đếm được số nhiều' cực chuẩn ngữ pháp."
    ),
    "A similar pattern can be seen in the data for Canada.": (
        "Task 1", "Comparisons",
        "Canada also has almost the same kind of chart.",
        "A similar pattern",
        ["A same style", "An alike shape", "A matching picture"],
        "'A similar pattern can be seen in...' dùng để nhóm đối tượng có xu hướng tương đồng."
    ),
    "Japan recorded the highest proportion of elderly people, at 28%.": (
        "Task 1", "Comparisons",
        "Japan had the biggest percent of old people, which was 28%.",
        "recorded the highest",
        ["scored the tallest", "wrote the largest", "marked the biggest"],
        "Động từ 'record' + giới từ 'at + số liệu' là bộ đôi nâng cấp điển hình trong Task 1."
    ),
    "Approximately a quarter of respondents (24%) preferred online classes.": (
        "Task 1", "Proportions",
        "About 24% of people in the survey liked online classes more.",
        "Approximately a quarter of",
        ["Roughly one-fourth in", "Nearly a quad of", "About quarter percent of"],
        "Quy đổi tỷ lệ phần trăm (~24-26%) sang phân số 'approximately a quarter of' giúp đa dạng từ vựng."
    ),
    "The vast majority of students (87%) used a laptop.": (
        "Task 1", "Proportions",
        "Almost all students (87%) used a laptop.",
        "The vast majority of",
        ["The huge most of", "A big major of", "The large majority in"],
        "'The vast majority of' diễn tả tỷ lệ áp đảo (trên 80%) cực kỳ học thuật."
    ),
    "In the first stage of the process, raw materials are collected and sorted.": (
        "Task 1", "Process",
        "First, workers collect and sort the raw materials.",
        "In the first stage of the process,",
        ["At the starting step in process,", "Firstly of the whole process,", "In step number one of making,"],
        "Bài Process nên dùng bị động hiện tại đơn kèm cụm đánh dấu giai đoạn 'In the first stage of the process,'."
    ),
    "Once the clay has been shaped, it is fired in a kiln.": (
        "Task 1", "Process",
        "After people shape the clay, they put it into a hot oven.",
        "Once the clay has been shaped,",
        ["When the clay is shaping,", "After the clay shaped,", "Once shaping the clay,"],
        "Cấu trúc 'Once + S + has/have been + V3' thể hiện sự hoàn tất của bước trước trong bài Process."
    ),
    "The final stage involves packaging the product for delivery.": (
        "Task 1", "Process",
        "The last step is workers put the product in boxes to send out.",
        "The final stage involves",
        ["The ending step includes to", "The last stage is making", "Finally stage consists"],
        "'involve + V-ing' giúp mô tả giai đoạn quy trình gọn gàng và chuẩn học thuật."
    ),
    "To the north of the village, a new housing estate was constructed.": (
        "Task 1", "Maps",
        "In the north of the village, they built a new group of houses.",
        "To the north of",
        ["At the northern of", "On the north side in", "Towards north from"],
        "'To the north of' dùng cho vị trí nằm bên ngoài ranh giới; kết hợp bị động quá khứ 'was constructed'."
    ),
    "The park was replaced by a car park.": (
        "Task 1", "Maps",
        "They took away the park and built a car park there.",
        "was replaced by",
        ["was changed with", "had replaced into", "got swapped by"],
        "'be replaced by' là cấu trúc bị động ngắn gọn chuẩn mực cho bài mô tả bản đồ."
    ),
    "The old school was converted into a library.": (
        "Task 1", "Maps",
        "The old school was changed to become a library.",
        "was converted into",
        ["was turned as", "was altered for", "was switched toward"],
        "'be converted into' dùng chính xác khi giữ khung công trình cũ nhưng đổi công năng."
    ),
    "The road was extended to connect the town with the motorway.": (
        "Task 1", "Maps",
        "The road was made longer so it joined the town and the big highway.",
        "was extended to connect",
        ["was lengthened for joining", "was stretched to link with", "was expanded in connecting"],
        "Động từ 'extend' chuyên dùng cho đường sá, cầu cống, bến cảng được kéo dài trên bản đồ."
    ),
    # 5. Writing > Task 2 (30 notes)
    "Although technology has many benefits, it can also isolate people.": (
        "Task 2", "Concession",
        "Technology has many benefits, but it can also make people lonely.",
        "Although",
        ["Despite", "However", "In spite of"],
        "Dùng 'Although + mệnh đề' (không đi kèm 'but') để tạo câu phức nhượng bộ mạch lạc."
    ),
    "While some argue that tuition should be free, others believe students should contribute.": (
        "Task 2", "Introduction",
        "Some people say university should be free, and other people say students should pay.",
        "While some argue that",
        ["Whereas someone arguing", "Although some people saying", "During some argue that"],
        "Mở bài dạng Discussion cực gọn và cân bằng bằng cấu trúc 'While some argue that..., others believe...'."
    ),
    "On the one hand, cars offer convenience; on the other hand, they cause pollution.": (
        "Task 2", "Contrast",
        "Cars are convenient, but also cars make air pollution.",
        "On the one hand,",
        ["In one hand,", "From the first hand,", "At the one side,"],
        "Cặp liên kết 'On the one hand... on the other hand' chuẩn mực khi phân tích hai mặt vấn đề."
    ),
    "Admittedly, renewable energy can be expensive to install.": (
        "Task 2", "Concession",
        "I know that renewable energy costs a lot of money to set up.",
        "Admittedly,",
        ["Actually speaking,", "Honestly saying,", "Truly admitted,"],
        "Trạng từ 'Admittedly,' mở câu nhượng bộ sắc sảo trước khi đưa lập luận phản biện."
    ),
    "Nevertheless, the long-term savings are considerable.": (
        "Task 2", "Contrast",
        "But even so, saving money over a long time is very big.",
        "Nevertheless,",
        ["Although,", "Despite,", "Even though,"],
        "'Nevertheless,' là trạng từ liên kết đầu câu cực ăn khớp ngay sau câu nhượng bộ 'Admittedly,'."
    ),
    "This is not to say that traditional teaching has no value.": (
        "Task 2", "Concession",
        "I am not saying that old-style teaching is useless.",
        "This is not to say that",
        ["It does not mean for", "This is not speaking that", "That is no saying"],
        "Cấu trúc 'This is not to say that...' làm mềm lập luận, tránh cực đoan — đặc trưng văn phong Band 8.0."
    ),
    "Contrary to popular belief, older workers are often more productive.": (
        "Task 2", "Contrast",
        "Different from what many people think, older workers often work better.",
        "Contrary to popular belief,",
        ["Opposite with common thinking,", "Against to general idea,", "Unlike popular believing,"],
        "'Contrary to + cụm danh từ' là cụm chuyển ý phản bác quan niệm phổ biến rất tự nhiên."
    ),
    "This policy could reduce traffic. Consequently, air quality would improve.": (
        "Task 2", "Cause & Effect",
        "This policy might reduce traffic. So the air will get cleaner.",
        "Consequently,",
        ["So that,", "As result,", "Because of this so,"],
        "Dùng 'Consequently,' ở đầu câu thay cho 'So' để giữ văn phong trang trọng."
    ),
    "Due to rising rents, many young people still live with their parents.": (
        "Task 2", "Cause & Effect",
        "Because rents are going up, many young people still stay with their parents.",
        "Due to rising rents,",
        ["Due to rents are rising,", "Because of rents go up,", "Owing to rents increased,"],
        "'Due to + cụm danh từ' giúp câu súc tích hơn mệnh đề 'Because...'."
    ),
    "As a result of automation, many factory jobs have disappeared.": (
        "Task 2", "Cause & Effect",
        "Because of machines doing work, lots of factory jobs are gone.",
        "As a result of automation,",
        ["As result of automated,", "Resulting from automate,", "Because result of automation,"],
        "'As a result of + N' diễn đạt nguyên nhân khách quan, rất hợp chủ đề công nghệ và kinh tế."
    ),
    "Workers become more motivated. This, in turn, leads to higher productivity.": (
        "Task 2", "Cause & Effect",
        "Workers feel more motivated. And then this makes productivity higher.",
        "This, in turn, leads to",
        ["This by turn causes", "Which in return brings", "That on turn results"],
        "Chuỗi nhân quả 'This, in turn, leads to...' cho thấy mạch phát triển ý sâu sắc (Coherence & Cohesion 8.0)."
    ),
    "In addition to improving health, exercise can boost productivity.": (
        "Task 2", "Addition",
        "Exercise improves health, and also it can make people work better.",
        "In addition to improving",
        ["Besides to improve", "Additionally to improving", "In addition of improving"],
        "'In addition to + V-ing/N' gọn gàng hơn việc nối bằng 'and also'."
    ),
    "Not only does tourism create jobs, but it also promotes cultural exchange.": (
        "Task 2", "Inversion",
        "Tourism creates jobs and it also helps cultural exchange.",
        "Not only does tourism create",
        ["Not only tourism creates", "Not only did tourism creates", "Only not does tourism create"],
        "Đảo ngữ 'Not only + trợ động từ + S + V' nâng điểm Grammatical Range rõ rệt."
    ),
    "Were governments to invest more in public transport, fewer people would drive.": (
        "Task 2", "Inversion",
        "If governments put more money into buses and trains, fewer people would drive.",
        "Were governments to invest",
        ["If were governments invest", "Should governments invested", "Were governments investing to"],
        "Đảo ngữ câu điều kiện loại 2 'Were + S + to V' là cấu trúc giả định Band 8.0 kinh điển."
    ),
    "Had the policy been introduced earlier, many lives could have been saved.": (
        "Task 2", "Inversion",
        "If they had started the policy sooner, many people would not have died.",
        "Had the policy been introduced",
        ["If had the policy introduced", "Has the policy been introduced", "Had the policy introduced"],
        "Đảo ngữ điều kiện loại 3 kết hợp bị động 'Had + S + been + V3' cho thấy kiểm soát ngữ pháp đỉnh cao."
    ),
    "What concerns me most is the impact on children's mental health.": (
        "Task 2", "Complex Structures",
        "The thing that worries me most is how it affects children's mental health.",
        "What concerns me most is",
        ["Which worries me most is", "That concerns me mostly is", "What is concerning me most are"],
        "Câu chẻ (Wh-cleft sentence) 'What concerns me most is...' giúp nhấn mạnh trọng tâm lập luận."
    ),
    "The extent to which technology improves learning depends on how it is used.": (
        "Task 2", "Complex Structures",
        "How much technology makes learning better depends on how people use it.",
        "The extent to which",
        ["The degree where", "The level in which", "The amount that"],
        "Cụm danh từ hóa 'The extent to which...' là dấu ấn học thuật chuẩn Cambridge Band 8.0."
    ),
    "Rather than building more roads, cities should improve public transport.": (
        "Task 2", "Complex Structures",
        "Instead of making more roads, cities should make public transport better.",
        "Rather than building",
        ["Rather than to build", "Instead to build", "More than building"],
        "'Rather than + V-ing' ở đầu câu nêu sự đối chiếu giải pháp cực sắc bén."
    ),
    "Provided that it is properly regulated, gene editing could cure many diseases.": (
        "Task 2", "Complex Structures",
        "If people control it well, gene editing might cure many illnesses.",
        "Provided that it is properly regulated,",
        ["Providing that it regulates well,", "Given that properly regulating,", "Only if it is proper regulate,"],
        "'Provided that + mệnh đề' diễn tả điều kiện chặt chẽ thay cho 'If' lặp lại."
    ),
    "It is often argued that university education should be free.": (
        "Task 2", "Hedging & Opinion",
        "Many people say that university should not cost money.",
        "It is often argued that",
        ["People often arguing that", "It often argues that", "There is often argued that"],
        "Bị động khách quan 'It is often argued that...' mở đầu vấn đề học thuật trung lập."
    ),
    "It could be argued that social media does more harm than good.": (
        "Task 2", "Hedging & Opinion",
        "Social media is definitely worse than it is good.",
        "It could be argued that",
        ["It must be proven that", "It can argue that", "We are surely arguing"],
        "Ngôn ngữ rào đón (hedging) 'It could be argued that...' tránh khẳng định cực đoan."
    ),
    "Young people tend to spend more time online than older generations.": (
        "Task 2", "Hedging & Opinion",
        "All young people spend more time on the internet than old people.",
        "tend to spend",
        ["always are spending", "tending to spend", "intend to spend"],
        "Động từ 'tend to + V' là công cụ rào đón đơn giản mà hiệu quả cao nhất trong Task 2."
    ),
    "From my perspective, the advantages outweigh the disadvantages.": (
        "Task 2", "Hedging & Opinion",
        "In my thinking, the good points are bigger than the bad points.",
        "From my perspective,",
        ["In my point of thinking,", "By my opinion,", "According to my view,"],
        "'From my perspective,' tự nhiên và tránh lỗi giới từ 'According to me'."
    ),
    "The advantages of online learning outweigh its drawbacks.": (
        "Task 2", "Hedging & Opinion",
        "Online learning has more good things than bad things.",
        "outweigh its drawbacks",
        ["overweight its problems", "are heavier than bads", "exceed over its negatives"],
        "Collocation 'outweigh its drawbacks' là cụm vàng cho dạng đề Advantages/Disadvantages."
    ),
    "A case in point is Singapore, where public transport is cheap and efficient.": (
        "Task 2", "Examples",
        "One good example is Singapore because buses and trains there are cheap and good.",
        "A case in point is",
        ["A point in case is", "One example case is", "A proof in point is"],
        "'A case in point is + N' là cách đưa ví dụ điển hình tinh tế thay vì lặp 'For example'."
    ),
    "For instance, many Scandinavian countries offer free university education.": (
        "Task 2", "Examples",
        "Like many Scandinavian countries give free university.",
        "For instance,",
        ["As an instance,", "By example,", "Like example,"],
        "'For instance,' dùng chuẩn xác ở đầu câu thay cho 'Like' (vốn quá suồng sã)."
    ),
    "In light of these problems, governments must act quickly.": (
        "Task 2", "Cause & Effect",
        "Because of these problems, governments need to do something fast.",
        "In light of these problems,",
        ["Under the light of problems,", "In view to these problems,", "Seeing these problems,"],
        "'In light of + N' (xét trước tình hình này) là cụm chuyển đoạn kết luận cực mượt."
    ),
    "In conclusion, while both views have merit, I believe education is the key.": (
        "Task 2", "Conclusion",
        "Finally, both sides are kind of right, but I think education is most important.",
        "while both views have merit,",
        ["although two sides having good,", "when both opinions are true,", "despite both views merit,"],
        "'while both views have merit' tóm tắt sắc thái cân bằng trước khi chốt quan điểm cá nhân."
    ),
    "All things considered, investing in education is the best long-term solution to poverty.": (
        "Task 2", "Conclusion",
        "After looking at everything, putting money in schools is the best way to stop poverty.",
        "All things considered,",
        ["Considering all of things,", "All matters thinking,", "When all things consider,"],
        "'All things considered,' là cụm mở đoạn kết luận tự nhiên và sang trọng."
    ),
    "The main reason why people move to cities is to find better jobs.": (
        "Task 2", "Complex Structures",
        "The main reason is because people move to cities to get better jobs.",
        "The main reason why",
        ["The main reason is because", "The chief reason because", "The key reason for why"],
        "Tránh lỗi kinh điển 'The reason is because'; dùng 'The main reason why... is to V / that...'."
    ),
}

EXTRA_WRITING_UPGRADES: list[tuple[str, str, str, str, str, list[str], str]] = [
    # (taskType, category, band6Sentence, band8Sentence, targetChunk, distractors, explanationVi)
    # --- 45 new Task 1 upgrades ---
    ("Task 1", "Trends", "Smartphone sales grew very fast between 2012 and 2018.", "Smartphone sales experienced rapid growth between 2012 and 2018.", "experienced rapid growth", ["happened fast growing", "saw a quick rise up", "made rapidly growth"], "Danh từ hóa bằng 'experience + adj + noun' giúp đa dạng cấu trúc câu Task 1."),
    ("Task 1", "Trends", "Coal usage dropped a lot after 2005.", "Coal usage witnessed a steep decline after 2005.", "witnessed a steep decline", ["saw a high falling", "looked at a deep drop", "had a sharply decline"], "'witness a steep decline' là collocation cực mượt khi miêu tả đường đi xuống mạnh."),
    ("Task 1", "Trends", "Tourism numbers went up slowly over the next ten years.", "Tourism numbers climbed steadily over the subsequent decade.", "climbed steadily", ["rose slowly up", "increased steady", "stepped up calmly"], "'climb steadily' + 'the subsequent decade' nâng cấp cả động từ lẫn cụm chỉ thời gian."),
    ("Task 1", "Trends", "Oil prices dropped suddenly in 2020 and then went back up quickly.", "Oil prices plummeted in 2020 before rebounding sharply.", "before rebounding sharply", ["then bouncing back fast", "before recovering up", "after jump back strongly"], "'plummet' + 'before rebounding sharply' diễn tả biểu đồ hình chữ V cực đắt giá."),
    ("Task 1", "Trends", "After 2010, the birth rate stopped changing and stayed flat.", "After 2010, the birth rate plateaued at roughly 1.6 children per woman.", "plateaued at", ["flatted on", "stopped flat at", "levelled down to"], "Động từ 'plateau at' chuyên dùng khi đường biểu đồ đi ngang sau giai đoạn tăng/giảm."),
    ("Task 1", "Trends", "The number of rail passengers dropped a little and then stayed the same.", "Rail passenger numbers dipped slightly before levelling off.", "before levelling off", ["before staying flatly", "then flatting out", "before becoming even"], "'dip slightly' + 'levelling off' diễn tả cú giảm nhẹ rồi chững lại chuẩn xác."),
    ("Task 1", "Trends", "Wind power went up very quickly from 5% to 35%.", "Wind power surged sevenfold from 5% to 35%.", "surged sevenfold", ["jumped seven times up", "increased by sevenfoldly", "grew seven-times"], "Trạng từ bội số 'sevenfold' (gấp 7 lần) rất súc tích cho mô tả tỷ lệ."),
    ("Task 1", "Trends", "Internet subscriptions got much bigger than landline phones in 2008.", "Internet subscriptions overtook landline connections in 2008.", "overtook", ["passed over", "beat up", "went higher over"], "Động từ 'overtake' (quá khứ overtook) chuyên dùng khi một đường vượt lên trên đường khác."),
    ("Task 1", "Trends", "The gap between rich and poor regions got bigger every year.", "The disparity between urban and rural incomes widened progressively.", "widened progressively", ["grew wider slowly", "broadened up each time", "opened bigger steadily"], "'disparity' + 'widen progressively' nâng cấp hoàn toàn cho 'gap got bigger'."),
    ("Task 1", "Trends", "The difference between men and women got smaller by 2020.", "The gender gap narrowed considerably by 2020.", "narrowed considerably", ["shortened much", "thinned significantly", "shrunk a lot"], "'narrow considerably' là collocation tự nhiên của 'gap'."),
    ("Task 1", "Trends", "Gas consumption fell by half during the twenty-year period.", "Gas consumption halved over the twenty-year timeframe.", "halved", ["cut half", "reduced two times", "divided into half"], "Động từ 'halve' (giảm một nửa) gọn hơn nhiều so với 'fell by half'."),
    ("Task 1", "Trends", "Coffee exports rose a little bit from 100 to 108 tonnes.", "Coffee exports edged upward marginally from 100 to 108 tonnes.", "edged upward marginally", ["pushed up tiny", "crawled up a bit", "grew weakly"], "'edge upward marginally' mô tả mức tăng rất nhẹ cực kỳ tinh tế."),
    ("Task 1", "Trends", "Attendance went up and down wildly throughout the winter.", "Attendance exhibited erratic fluctuations throughout the winter.", "exhibited erratic fluctuations", ["showed crazy up-downs", "had wild waving", "displayed unstable shakes"], "'exhibit erratic fluctuations' dùng cho đường zic-zac biến động thất thường."),
    ("Task 1", "Trends", "By 2018, bicycle use had gone back to its 2000 level.", "By 2018, bicycle usage had returned to its original 2000 baseline.", "returned to its original", ["came back to start", "reverted back at first", "reached back to base"], "Thì quá khứ hoàn thành 'By + năm, S + had returned to...' tăng điểm ngữ pháp mạnh."),
    ("Task 1", "Trends", "Solar output will probably reach 50% by 2040.", "Solar output is anticipated to account for 50% of supply by 2040.", "is anticipated to account for", ["is guessing to make up", "will expect to occupy", "is predicted occupying"], "'be anticipated to account for' chuẩn mực cho dự báo tỷ trọng tương lai."),
    ("Task 1", "Proportions", "Housing took up 42% of the average household budget.", "Housing accounted for 42% of average household expenditure.", "accounted for", ["occupied up", "took over", "consisted of"], "'account for' là động từ hàng đầu thay cho 'take up' trong biểu đồ tròn (Pie chart)."),
    ("Task 1", "Proportions", "Transport made up just under a fifth of total spending.", "Transport constituted just under a fifth of total outlay.", "constituted just under a fifth", ["built almost twenty percent", "formed nearly one-five", "composed below fifth"], "'constitute' + phân số 'just under a fifth' (18–19%) giúp bài Pie chart giàu từ vựng."),
    ("Task 1", "Proportions", "Only a very small part (3%) came from nuclear power.", "Nuclear power represented a negligible share, at merely 3%.", "represented a negligible share", ["showed a tiny slice", "stood for a small piece", "took a minor cut"], "'represent a negligible share' nâng cấp câu mô tả phần tỷ trọng nhỏ nhất."),
    ("Task 1", "Proportions", "Food and rent together were more than half of all costs.", "Combined, food and rent comprised well over half of total expenditure.", "comprised well over half", ["included much above half", "contained nicely over 50%", "consisted more than half"], "'Combined, ... comprised well over half' gộp hạng mục thông minh."),
    ("Task 1", "Proportions", "Almost two out of three residents used buses daily.", "Roughly two-thirds of residents relied on bus services daily.", "Roughly two-thirds of", ["About two-third of", "Nearly two out three", "Around sixty-six percent of"], "Phân số 'two-thirds' nhớ có 's' ở mẫu số khi tử số lớn hơn 1."),
    ("Task 1", "Proportions", "Exactly half of the respondents were aged under thirty.", "Precisely half of those surveyed fell into the under-thirty bracket.", "fell into the under-thirty bracket", ["dropped in below-30 group", "went inside young age", "stayed under 30 range"], "Cụm 'fall into the ... bracket' chuyên dùng để mô tả nhóm tuổi hoặc nhóm thu nhập."),
    ("Task 1", "Comparisons", "France produced much more wine than Germany did.", "France outstripped Germany by a wide margin in wine production.", "outstripped Germany by a wide margin", ["beat Germany very far", "exceeded over Germany widely", "surpassed Germany with big gap"], "'outstrip X by a wide margin' là cách so sánh vượt trội chuẩn Band 8.0."),
    ("Task 1", "Comparisons", "Italy was the second biggest exporter after Spain.", "Italy ranked second behind Spain in total export volume.", "ranked second behind", ["placed number two after", "stood secondly below", "came next under"], "'rank second behind X' diễn tả thứ hạng rõ ràng, không rườm rà."),
    ("Task 1", "Comparisons", "The figures for Japan and South Korea were almost the same.", "The figures for Japan and South Korea were virtually identical.", "were virtually identical", ["looked nearly same", "stayed almost equalled", "were closely matching"], "'virtually identical' thay thế gọn gàng cho 'almost the same'."),
    ("Task 1", "Comparisons", "Men spent three times more hours playing games than women.", "Men devoted three times as many hours to gaming as their female counterparts.", "as their female counterparts", ["than women people", "compared with female ones", "like the women group"], "'female/male counterparts' tránh lặp từ 'men/women' rất hiệu quả."),
    ("Task 1", "Comparisons", "Younger shoppers bought far more clothes online than older ones.", "Online apparel purchases were markedly higher among younger cohorts than older demographics.", "markedly higher among younger cohorts", ["much bigger inside young ages", "way taller for youth groups", "greatly upper among youngsters"], "'markedly higher' + 'cohorts / demographics' mang sắc thái học thuật rõ rệt."),
    ("Task 1", "Comparisons", "While Germany spent the most, Portugal spent the least.", "Germany led overall expenditure, whereas Portugal trailed at the bottom of the table.", "trailed at the bottom", ["lagged in the lowest", "followed down the floor", "stayed behind the end"], "'lead ... whereas X trailed at the bottom' tạo độ tương phản sắc nét."),
    ("Task 1", "Comparisons", "Water use in agriculture was far bigger than in industry.", "Agricultural water consumption dwarfed that of the industrial sector.", "dwarfed that of", ["made smaller than it of", "towered over those of", "exceeded hugely it of"], "Động từ 'dwarf' (làm lu mờ vì lớn gấp nhiều lần) rất ấn tượng khi chênh lệch cực lớn."),
    ("Task 1", "Comparisons", "Both countries showed rising literacy, although Kenya grew faster.", "Both nations recorded gains in literacy, albeit at a markedly brisker pace in Kenya.", "albeit at a markedly brisker pace", ["even with a faster speed", "although in quicker step", "though by rapid rhythm"], "Liên từ 'albeit + cụm giới từ' giúp rút gọn mệnh đề nhượng bộ tinh tế."),
    ("Task 1", "Comparisons", "London had 9 million people, compared with 3 million in Madrid.", "London's population stood at 9 million, threefold that of Madrid.", "threefold that of", ["three times than it of", "triple bigger than", "three-time of those in"], "'threefold that of' rút gọn vế so sánh bội số cực kỳ súc tích."),
    ("Task 1", "Overview", "Overall, all three countries used more clean energy over time.", "Overall, an upward trajectory was evident across all three nations throughout the timeframe.", "an upward trajectory was evident", ["a going-up road was clear", "a rising direction happened", "an upper line showed"], "'an upward trajectory was evident' nâng tầm câu Overview hẳn một band."),
    ("Task 1", "Overview", "In general, the village became much more modern and lost its farms.", "Overall, the village underwent substantial modernisation at the expense of its agricultural land.", "at the expense of", ["by losing away", "with the cost from", "replacing out of"], "'undergo modernisation at the expense of...' là khung Overview hoàn hảo cho bài Map."),
    ("Task 1", "Overview", "Overall, making paper takes seven steps from cutting trees to rolling paper.", "Overall, the linear manufacturing process comprises seven distinct stages, culminating in paper reels.", "comprises seven distinct stages, culminating in", ["has seven different steps, ending at", "includes seven parts, finishing by", "consists seven stages, stopping in"], "'comprise X distinct stages, culminating in...' là câu Overview chuẩn cho bài Process."),
    ("Task 1", "Overview", "In short, older people preferred TV while young people liked phones.", "Overall, clear generational divergence emerged, with older adults favouring television and younger groups preferring smartphones.", "clear generational divergence emerged", ["obvious age difference appeared", "strong gap between ages came", "big generation split showed"], "Cấu trúc 'with + N + V-ing' kèm 'generational divergence' rất tự nhiên."),
    ("Task 1", "Process", "Next, the beans are washed and put in the sun to dry.", "Subsequently, the harvested beans are rinsed thoroughly before being sun-dried.", "before being sun-dried", ["before drying by sun", "then be dried in sun", "prior to sun-drying them"], "Bị động sau giới từ 'before being + V3' giúp giữ mạch bị động nhất quán."),
    ("Task 1", "Process", "Then the hot glass is shaped into bottles by a machine.", "Following this, the molten glass is moulded into bottles via an automated press.", "is moulded into", ["is shaped to become", "gets formed like", "is made into shape of"], "'molten glass' + 'be moulded into' thể hiện vốn từ chuyên biệt cao."),
    ("Task 1", "Process", "After that, the water goes through a filter to become clean.", "Thereafter, the water passes through a filtration unit to remove impurities.", "to remove impurities", ["for cleaning dirt out", "so it becomes pure clean", "to wash away dirty things"], "'filtration unit' + 'remove impurities' chuẩn văn phong kỹ thuật Task 1 Process."),
    ("Task 1", "Process", "Finally, the bottles are checked and sent to shops.", "In the culminating step, finished bottles undergo quality inspection prior to retail distribution.", "undergo quality inspection prior to", ["get quality check before", "pass checking ahead of", "have test before"], "'undergo quality inspection prior to...' chuyên nghiệp hơn hẳn 'are checked and sent'."),
    ("Task 1", "Process", "The cycle starts again when adult salmon swim back upstream.", "The reproductive cycle repeats once mature salmon migrate back upstream.", "once mature salmon migrate", ["when grown salmon go", "after big salmon swim", "once adult salmon migrating"], "Dùng cho biểu đồ vòng đời tự nhiên (natural cycle): 'reproductive cycle', 'mature', 'migrate'."),
    ("Task 1", "Maps", "The farmland on the west side was destroyed to build a shopping mall.", "Farmland along the western flank was cleared to make way for a retail complex.", "was cleared to make way for", ["was broken to give place to", "got erased to build up", "was cut down for opening"], "'be cleared to make way for' là collocation kinh điển cho bài Map."),
    ("Task 1", "Maps", "A new bridge was built across the river next to the old factory.", "A pedestrian bridge was erected across the river adjacent to the former factory.", "was erected across the river adjacent to", ["was stood over the river beside", "got raised on river next", "was placed through river near"], "'be erected' + 'adjacent to' nâng cấp đồng thời động từ và giới từ vị trí."),
    ("Task 1", "Maps", "The small harbour became much bigger to hold cruise ships.", "The modest harbour underwent considerable expansion to accommodate cruise liners.", "underwent considerable expansion", ["got very big enlarging", "experienced huge growing", "became largely expanded"], "'undergo considerable expansion to accommodate...' diễn tả sự mở rộng cơ sở hạ tầng."),
    ("Task 1", "Maps", "The railway station stayed in the same place the whole time.", "The railway station remained unchanged throughout the entire twenty-year period.", "remained unchanged", ["kept not changing", "stayed untouched still", "held same position"], "Bài Map luôn cần nêu ít nhất 1 chi tiết giữ nguyên bằng 'remained unchanged / intact'."),
    ("Task 1", "Maps", "Trees were planted all around the edge of the sports centre.", "The perimeter of the sports complex was lined with newly planted trees.", "was lined with", ["was surrounded by putting", "got bordered in", "was filled along"], "'perimeter ... was lined with' miêu tả hàng cây bao quanh rất chuẩn xác."),
    ("Task 1", "Complex Sentences", "Sales rose to $5m in 2015, and this was the highest point.", "Sales rose to $5 million in 2015, marking the highest point of the decade.", ", marking the highest point", [", which mark the top point", ", marked the highest peak", ", to be marking the top"], "Mệnh đề rút gọn ', marking...' nối số liệu và nhận xét trong một câu duy nhất."),

    # --- 43 new Task 2 upgrades ---
    ("Task 2", "Introduction", "Nowadays many people think cities are too crowded.", "In contemporary society, rapid urban overcrowding has emerged as a pressing concern.", "has emerged as a pressing concern", ["has come out as big worry", "became a pushing problem", "appeared like heavy trouble"], "Tránh câu mở đầu sáo rỗng 'Nowadays many people think...'; dùng 'has emerged as a pressing concern'."),
    ("Task 2", "Introduction", "Some people say zoos are bad, while others say they save animals.", "Opinion remains sharply divided over whether zoological parks exploit wildlife or safeguard endangered species.", "Opinion remains sharply divided over whether", ["Ideas stay very split about if", "People are strictly broken on", "Views keep strongly separated whether"], "Câu mở đề Discussion Band 8.0 gọn, khách quan và bao quát hai luồng ý kiến."),
    ("Task 2", "Introduction", "I completely agree with the idea that governments should tax sugary drinks.", "I wholeheartedly endorse the proposal to levy higher taxes on sugar-sweetened beverages.", "wholeheartedly endorse the proposal to levy", ["fully say yes to plan putting", "totally agree the idea taxing", "strongly support to charge"], "'endorse the proposal to levy taxes on' nâng tầm Lexical Resource cực mạnh."),
    ("Task 2", "Hedging & Opinion", "Working from home always makes employees happier.", "Remote work often fosters greater job satisfaction, provided that clear boundaries are maintained.", "often fosters greater job satisfaction", ["always creates bigger happiness", "usually makes happier feeling", "surely brings happy work"], "Tránh 'always'; dùng 'often fosters' kèm điều kiện 'provided that'."),
    ("Task 2", "Hedging & Opinion", "Social media destroys teenagers' mental health completely.", "Excessive social media exposure can exert a detrimental influence on adolescent psychological wellbeing.", "exert a detrimental influence on", ["put a harmful power to", "make a bad impact over", "give a damaging effect in"], "'exert a detrimental influence on' vừa học thuật vừa có độ rào đón ('can')."),
    ("Task 2", "Hedging & Opinion", "Banning cars in city centres will solve air pollution.", "Restricting private vehicles in inner cities would go a long way towards curbing urban air pollution.", "would go a long way towards curbing", ["will walk far to stopping", "would go far way for cut", "can solve completely"], "'go a long way towards + V-ing' diễn tả giải pháp mang lại hiệu quả lớn mà không nói quá."),
    ("Task 2", "Hedging & Opinion", "University degrees are useless now because of online courses.", "While online courses widen access, formal degrees arguably retain substantial signalling value for employers.", "arguably retain substantial signalling value", ["surely keep big showing worth", "clearly hold large sign value", "probably remain heavy meaning"], "Trạng từ rào đón 'arguably' thể hiện tư duy phản biện sắc sảo."),
    ("Task 2", "Cause & Effect", "Too much homework makes students stressed and tired.", "An excessive academic workload can precipitate chronic stress and emotional burnout among pupils.", "precipitate chronic stress", ["push down heavy worry", "bring fast long stress", "make serious tired"], "Động từ 'precipitate' (châm ngòi, gây ra nhanh chóng) rất đắt giá trong bài nguyên nhân-hệ quả."),
    ("Task 2", "Cause & Effect", "Bad public transport causes more traffic jams.", "Inadequate public transit infrastructure inevitably drives commuters toward private car dependency.", "inevitably drives commuters toward", ["surely pushes drivers into", "certainly forces people to go", "always leads travellers on"], "'drive X toward Y' mô tả cơ chế nhân quả hành vi rất tự nhiên."),
    ("Task 2", "Cause & Effect", "Poor diets lead to higher hospital costs for the country.", "Widespread nutritional deficiencies place an unsustainable strain on national healthcare budgets.", "place an unsustainable strain on", ["put a heavy pressure in", "give an unkeepable stress to", "make a big burden over"], "'place an unsustainable strain on' là collocation Band 8.0 chuẩn cho áp lực ngân sách."),
    ("Task 2", "Cause & Effect", "Cutting down forests makes climate change worse.", "Unchecked deforestation accelerates greenhouse emissions, thereby compounding global climate instability.", ", thereby compounding", [", therefore adding worse", ", thus making heavier", ", so increasing badly"], "', thereby + V-ing' nối kết quả tức thì trong cùng một câu cực mượt."),
    ("Task 2", "Cause & Effect", "This problem happens because people lack financial education.", "This predicament stems primarily from a widespread lack of early financial literacy.", "stems primarily from", ["comes mainly out", "roots mostly by", "starts firstly because"], "'stem primarily from' là động từ học thuật thay cho 'happen because of'."),
    ("Task 2", "Cause & Effect", "Better childcare lets more mothers return to work.", "Accessible childcare enables parents to re-enter the labour market, fostering broader economic growth.", ", fostering broader economic growth", [", which foster wider economy", ", to fostering more growth", ", and makes economy grow bigger"], "Mệnh đề phân từ ', fostering...' nối chuỗi hệ quả tự nhiên."),
    ("Task 2", "Concession", "Even though electric cars are expensive, they save fuel over time.", "Notwithstanding their steep upfront cost, electric vehicles deliver lower lifetime operating expenses.", "Notwithstanding their steep upfront cost,", ["Despite of their high first price,", "Although their expensive upfront cost,", "In spite they cost high first,"], "'Notwithstanding + cụm danh từ' là dạng nhượng bộ trang trọng bậc cao."),
    ("Task 2", "Concession", "Even if governments pass strict laws, some companies will still pollute.", "Strict legislation alone, however well-intentioned, cannot eliminate corporate pollution without rigorous enforcement.", ", however well-intentioned,", [", although good intention,", ", despite well-meaning,", ", whatever good aim,"], "Cấu trúc chêm ', however + adj,' tạo câu văn mạch lạc, sắc sảo."),
    ("Task 2", "Concession", "Yes, tourism brings money, but it also damages old buildings.", "Granted, mass tourism generates vital revenue; yet unchecked visitor numbers can erode fragile heritage sites.", "Granted, mass tourism generates", ["Accepting, big tourism makes", "Agreeing, mass tourism brings", "Admitting to, tourism creates"], "'Granted, ...; yet ...' là cặp nhượng bộ – phản biện ngắn gọn, đầy uy lực."),
    ("Task 2", "Concession", "Although AI helps doctors, it cannot replace human empathy.", "Valuable though AI diagnostics may be, algorithms cannot replicate genuine human empathy.", "Valuable though AI diagnostics may be,", ["Though valuable AI diagnostics is,", "Despite valuable AI may be,", "As valuable AI diagnostics are,"], "Đảo tính từ lên đầu 'Adj + though/as + S + may be' là cấu trúc Band 8.5 ấn tượng."),
    ("Task 2", "Contrast", "Unlike rich nations, developing countries struggle to fund green energy.", "In stark contrast to affluent nations, developing economies face acute capital constraints in financing clean energy.", "In stark contrast to", ["In big opposite with", "With strong difference from", "On sharp contrary to"], "'In stark contrast to' tạo sắc thái đối lập mạnh và chuẩn collocation."),
    ("Task 2", "Contrast", "Some workers love flexibility, while others feel lonely at home.", "Whereas remote arrangements appeal to self-directed staff, they can leave newer employees feeling isolated.", "Whereas remote arrangements appeal to", ["While remote working liking by", "Despite remote jobs attract", "However remote setups interest"], "'Whereas' mở đầu câu so sánh hai nhóm đối tượng mạch lạc."),
    ("Task 2", "Inversion", "We rarely see such rapid change in job markets.", "Seldom have labour markets undergone such rapid structural transformation.", "Seldom have labour markets undergone", ["Seldom labour markets have undergone", "Rarely did labour markets underwent", "Seldom had labour markets undergo"], "Đảo ngữ trạng từ phủ định 'Seldom + have + S + V3' giúp nâng tầm ngữ pháp."),
    ("Task 2", "Inversion", "Society can solve this crisis only by working together.", "Only through coordinated international cooperation can nations tackle transboundary climate risks.", "Only through coordinated international cooperation can", ["Only by global working together nations can", "Only through cooperation nations are able", "Only when cooperating can nations to"], "Đảo ngữ 'Only through + N + modal + S + V' cực hợp đoạn giải pháp/kết luận."),
    ("Task 2", "Inversion", "We should never sacrifice student safety for lower costs.", "Under no circumstances should schools compromise student safety to cut expenditure.", "Under no circumstances should schools compromise", ["In no situation schools should give up", "Under no condition should schools to risk", "Never circumstances schools compromise"], "Đảo ngữ 'Under no circumstances + should + S + V' mang sắc thái khẳng định đanh thép."),
    ("Task 2", "Inversion", "If cities fail to upgrade drainage, floods will worsen.", "Should municipalities fail to modernise drainage networks, seasonal flooding will intensify.", "Should municipalities fail to", ["If should cities fail to", "Should cities failing to", "Would municipalities fail to"], "Đảo ngữ điều kiện loại 1 'Should + S + V' trang trọng hơn 'If...'."),
    ("Task 2", "Complex Structures", "It is very important that governments protect wetlands.", "It is imperative that policymakers safeguard remaining coastal wetlands before irreversible loss occurs.", "It is imperative that policymakers safeguard", ["It is urgent for policymakers safeguarding", "It is imperative policymakers to protect", "It is very vital that officials protects"], "Thức giả định 'It is imperative that + S + V (nguyên thể)' chuẩn Band 8.0."),
    ("Task 2", "Complex Structures", "When people live longer, pension systems face more pressure.", "The longer life expectancy rises, the heavier the fiscal burden placed on state pension funds.", "The longer life expectancy rises, the heavier", ["More long people live, more heavy", "The more longer life grows, heavier", "As longer life expectancy, the heavier"], "Cấu trúc so sánh kép 'The + adj-er ..., the + adj-er ...' diễn tả mối tương quan tuyến tính."),
    ("Task 2", "Complex Structures", "Because they lack affordable homes, young couples delay having kids.", "Constrained by soaring housing prices, many young couples postpone starting a family.", "Constrained by soaring housing prices,", ["Constraining by high house costs,", "Because constrained by high homes,", "Been constrained from housing prices,"], "Mệnh đề phân từ quá khứ 'Constrained by...' rút gọn nguyên nhân cực gọn."),
    ("Task 2", "Complex Structures", "People should focus on preventing disease instead of just treating it.", "Health systems ought to prioritise preventive care over costly late-stage intervention.", "prioritise preventive care over", ["put first stopping disease than", "prefer preventing illness more than", "focus firstly on prevention against"], "'prioritise A over B' diễn tả thứ tự ưu tiên chính sách cực súc tích."),
    ("Task 2", "Complex Structures", "The internet has completely changed how news is shared.", "Digital platforms have fundamentally reshaped the dissemination of public information.", "fundamentally reshaped the dissemination of", ["totally changed the spreading for", "completely rebuilt how sharing", "deeply turned the giving out of"], "Danh từ hóa 'the dissemination of public information' mang sắc thái học thuật rõ nét."),
    ("Task 2", "Academic Collocation", "Governments need to make strict rules on plastic packaging.", "Authorities must enact stringent regulations governing single-use plastic packaging.", "enact stringent regulations", ["make hard rules", "build strict laws", "do tight policies"], "'enact stringent regulations' là bộ ba collocation chuẩn mực cho chủ đề môi trường/luật."),
    ("Task 2", "Academic Collocation", "Education plays a very big role in reducing crime.", "Equitable access to quality education plays a pivotal role in curbing youth offending.", "plays a pivotal role in curbing", ["takes a big part to stop", "makes a crucial job in cutting", "plays a giant role for reducing"], "'play a pivotal role in + V-ing' thay thế xuất sắc cho 'play a very big role'."),
    ("Task 2", "Academic Collocation", "We must find a balance between growth and nature.", "Policymakers must strike a delicate balance between economic expansion and ecological preservation.", "strike a delicate balance between", ["hit a careful middle of", "find a soft equal between", "make a gentle balance among"], "'strike a delicate balance between A and B' là cụm tủ Band 8.0 cho mọi đề cân bằng lợi ích."),
    ("Task 2", "Academic Collocation", "Rich countries should help poor countries fight climate change.", "Affluent nations bear a moral obligation to assist developing countries in climate adaptation.", "bear a moral obligation to assist", ["hold a good duty for helping", "carry an ethical must to help", "have moral responsibility assisting"], "'bear a moral obligation to + V' nâng cấp mạnh cho 'should help'."),
    ("Task 2", "Academic Collocation", "Advertising makes children want unhealthy snacks.", "Targeted marketing fuels excessive consumption of calorie-dense snacks among children.", "fuels excessive consumption of", ["fires too much eating of", "pushes over-eating in", "feeds huge consuming for"], "Động từ 'fuel' (thúc đẩy mạnh xu hướng tiêu cực) + 'excessive consumption' cực tự nhiên."),
    ("Task 2", "Academic Collocation", "Technology can close the gap between rural and city schools.", "High-speed broadband can bridge the educational divide between remote villages and metropolitan schools.", "bridge the educational divide", ["close the study hole", "fill the learning split", "shut the school gap"], "'bridge the divide' là collocation chuẩn cho việc thu hẹp khoảng cách số/giáo dục."),
    ("Task 2", "Academic Collocation", "Art and music should not be cut from school timetables.", "Creative disciplines merit a permanent place within the core secondary curriculum.", "merit a permanent place within", ["deserve a forever spot inside", "earn an endless seat in", "worth a lasting position into"], "Động từ 'merit' (xứng đáng có được) rất tinh tế trong văn nghị luận."),
    ("Task 2", "Academic Collocation", "Punishing criminals harshly does not always stop them from offending again.", "Harsh custodial sentences alone rarely act as an effective deterrent against reoffending.", "act as an effective deterrent against", ["work like a strong stopper for", "serve as good prevention to", "behave as strong block against"], "'act as an effective deterrent against' là cụm từ chuyên ngành tội phạm học Band 8.0."),
    ("Task 2", "Academic Collocation", "People are losing touch with local traditions because of global media.", "Globalised media ecosystems risk eroding distinctive local cultural traditions.", "risk eroding distinctive local cultural traditions", ["danger breaking unique native cultures", "threaten erasing special home customs", "may spoil own local habits"], "'risk + V-ing' + 'erode cultural traditions' tự nhiên và chính xác."),
    ("Task 2", "Examples", "For example, Amsterdam has built lots of safe bike lanes.", "A compelling illustration is Amsterdam, where dedicated cycling corridors have dramatically lowered car reliance.", "A compelling illustration is", ["A strong drawing is", "One convincing picture is", "A powerful photo is"], "'A compelling illustration is...' thay thế hoàn hảo cho 'For example'."),
    ("Task 2", "Examples", "Countries like Denmark show that wind power works well.", "Nordic economies such as Denmark exemplify the viability of large-scale wind generation.", "exemplify the viability of", ["example the working of", "illustrate the possible of", "show the can-do of"], "Động từ 'exemplify' (là minh chứng điển hình cho) rất gọn và sắc bén."),
    ("Task 2", "Examples", "This can be seen clearly in how smartphones changed banking.", "This shift is vividly illustrated by the rapid adoption of mobile banking across emerging markets.", "is vividly illustrated by", ["is brightly shown from", "gets clearly pictured with", "is strongly seen through"], "'be vividly illustrated by' giúp đưa dẫn chứng thực tế mượt mà."),
    ("Task 2", "Addition", "Also, green spaces help people feel less stressed.", "Equally noteworthy is the restorative effect of urban parks on residents' mental health.", "Equally noteworthy is", ["Similarly famous is", "Also worth-noting are", "Equally noticing is"], "Đảo ngữ 'Equally noteworthy is + N' nối ý bổ sung vô cùng trang nhã."),
    ("Task 2", "Conclusion", "To sum up, both parents and schools must teach kids online safety.", "In summary, safeguarding young internet users demands a concerted effort from both families and educators.", "demands a concerted effort from", ["needs a joined trying by", "requires a together work from", "asks a united power of"], "'demand a concerted effort from' là cụm chốt giải pháp phối hợp chuẩn Band 8.0."),
    ("Task 2", "Conclusion", "In conclusion, I think public transport investment is worth the money.", "On balance, sustained investment in public transit yields far-reaching dividends that clearly justify its fiscal cost.", "On balance, sustained investment", ["At the balance, lasting spending", "In balance, kept investing", "By balance, continuous funding"], "'On balance,' kết luận cân nhắc kỹ hai chiều trước khi chốt lập trường."),
]


def build_writing_upgrades(anki_decks: dict[str, list[dict]]) -> list[dict]:
    items: list[dict] = []
    seen_b8: set[str] = set()
    idx = 1

    # 1. Extract from Anki `2. Collocation` and `5. Writing`
    anki_notes = []
    for dname, notes in anki_decks.items():
        if "2. Collocation" in dname or "5. Writing" in dname:
            anki_notes.extend([(dname, n) for n in notes])

    for dname, note in anki_notes:
        fields = note["fields"]
        if not fields:
            continue
        plain_b8, chunks = strip_cloze(fields[0])
        if not plain_b8 or plain_b8.lower() in seen_b8:
            continue
        if plain_b8 in ANKI_WRITING_UPGRADE_MAP:
            task_type, cat, b6, target, distractors, expl = ANKI_WRITING_UPGRADE_MAP[plain_b8]
        else:
            task_type = "Task 1" if "Task 1" in dname else "Task 2"
            cat = "Academic Structure"
            target = chunks[0] if chunks else plain_b8.split()[0]
            b6 = plain_b8
            distractors = ["informal wording", "incorrect structure", "redundant phrase"]
            expl = fields[1] if len(fields) > 1 and fields[1] else "Cấu trúc nâng cấp câu chuẩn Band 8.0."
        items.append(
            {
                "id": f"wup_{idx:03d}",
                "taskType": task_type,
                "category": cat,
                "band6Sentence": b6,
                "band8Sentence": plain_b8,
                "targetChunk": target,
                "distractors": distractors,
                "explanationVi": expl,
            }
        )
        seen_b8.add(plain_b8.lower())
        idx += 1

    # Fallback if Anki DB missing on another machine
    for plain_b8, (task_type, cat, b6, target, distractors, expl) in ANKI_WRITING_UPGRADE_MAP.items():
        if plain_b8.lower() not in seen_b8:
            items.append(
                {
                    "id": f"wup_{idx:03d}",
                    "taskType": task_type,
                    "category": cat,
                    "band6Sentence": b6,
                    "band8Sentence": plain_b8,
                    "targetChunk": target,
                    "distractors": distractors,
                    "explanationVi": expl,
                }
            )
            seen_b8.add(plain_b8.lower())
            idx += 1

    # 2. Add curated Band 6 -> Band 8 Writing upgrades
    for task_type, cat, b6, b8, target, distractors, expl in EXTRA_WRITING_UPGRADES:
        if b8.lower() in seen_b8:
            continue
        items.append(
            {
                "id": f"wup_{idx:03d}",
                "taskType": task_type,
                "category": cat,
                "band6Sentence": b6,
                "band8Sentence": b8,
                "targetChunk": target,
                "distractors": distractors,
                "explanationVi": expl,
            }
        )
        seen_b8.add(b8.lower())
        idx += 1

    return items


# ==============================================================================
# SECTION 5: WRITING ERROR FIXES (>= 100 items: Band 6.5 -> 8.0)
# ==============================================================================

WRITING_ERROR_FIXES_DATA: list[tuple[str, str, str, str, list[str], str]] = [
    # (category, sentenceWithError, errorSpan, correction, distractors, explanationVi)
    # --- 1. Subject-Verb Agreement (10) ---
    ("Subject-Verb Agreement", "The number of international students applying for scholarships have risen sharply.", "have risen", "has risen", ["are rising", "were risen", "having risen"], "'The number of + danh từ số nhiều' luôn đi với động từ số ít ('has risen')."),
    ("Subject-Verb Agreement", "A large proportion of household budgets are spent on rent in major cities.", "are spent", "is spent", ["were spending", "have spent", "being spent"], "Chủ ngữ chính là 'A large proportion' (hoặc phần không đếm được), nên chia động từ số ít 'is spent'."),
    ("Subject-Verb Agreement", "Each of the proposed climate policies require substantial public funding.", "require", "requires", ["are requiring", "were required", "requiring"], "'Each of + danh từ số nhiều' luôn chia động từ số ít ('requires')."),
    ("Subject-Verb Agreement", "Neither the municipal council nor local businesses has approved the toll plan.", "has approved", "have approved", ["is approving", "was approved", "approves"], "Với 'Neither A nor B', động từ chia theo chủ ngữ gần nhất ('local businesses' -> số nhiều 'have approved')."),
    ("Subject-Verb Agreement", "The rapid expansion of online retail, combined with rising rents, have forced many shops to close.", "have forced", "has forced", ["are forcing", "were forced", "force"], "Chủ ngữ chính là 'The rapid expansion' (số ít); cụm 'combined with...' không làm chủ ngữ thành số nhiều."),
    ("Subject-Verb Agreement", "Investing heavily in early childhood education yield measurable long-term returns.", "yield", "yields", ["are yielding", "have yielded", "were yielding"], "Danh động từ làm chủ ngữ ('Investing...') luôn đi với động từ số ít ('yields')."),
    ("Subject-Verb Agreement", "There is several compelling reasons why urban cycling should be subsidised.", "There is", "There are", ["There has", "There was", "It is"], "Danh từ đứng sau là 'several compelling reasons' (số nhiều) nên phải dùng 'There are'."),
    ("Subject-Verb Agreement", "One of the most pressing challenges facing cities today are air pollution.", "are", "is", ["were", "have been", "be"], "Chủ ngữ chính là 'One' (số ít) trong 'One of the most pressing challenges...', nên động từ là 'is'."),
    ("Subject-Verb Agreement", "The percentage of graduates working remotely have doubled since 2019.", "have doubled", "has doubled", ["are doubling", "were doubled", "double"], "'The percentage of...' làm chủ ngữ luôn đi với động từ số ít ('has doubled')."),
    ("Subject-Verb Agreement", "Everybody who commutes during peak hours know how stressful gridlock can be.", "know", "knows", ["are knowing", "have known", "knowing"], "Đại từ bất định 'Everybody / Everyone' luôn chia động từ số ít ('knows')."),

    # --- 2. Countable / Uncountable Nouns (10) ---
    ("Uncountable Nouns", "Modern hospitals rely on advanced medical equipments to diagnose patients early.", "equipments", "equipment", ["an equipment", "equipment's", "many equipment"], "'equipment' là danh từ không đếm được, không bao giờ thêm -s."),
    ("Uncountable Nouns", "Governments must provide clearer informations about how personal data is stored.", "informations", "information", ["an information", "many informations", "few information"], "'information' không đếm được; muốn đếm phải dùng 'pieces of information'."),
    ("Uncountable Nouns", "Recent researches indicate that green spaces significantly lower urban stress.", "Recent researches indicate", "Recent research indicates", ["A recent research indicate", "Many researches indicates", "Researches recently indicates"], "'research' là danh từ không đếm được nên không thêm -s và chia động từ số ít ('indicates')."),
    ("Uncountable Nouns", "University advisors offer valuable advices on career planning and internships.", "advices", "advice", ["an advice", "many advices", "several advice"], "'advice' không đếm được; không thêm -s hay dùng 'an advice'."),
    ("Uncountable Nouns", "Tourists frequently struggle to find affordable accommodations near the city centre.", "accommodations", "accommodation", ["an accommodation", "many accommodations", "few accommodation"], "Trong tiếng Anh Anh chuẩn IELTS, 'accommodation' là danh từ không đếm được."),
    ("Uncountable Nouns", "The study highlights a dramatic rise in the amount of private cars on city roads.", "the amount of", "the number of", ["a quantity for", "the sum in", "an amount for"], "'cars' là danh từ đếm được số nhiều nên phải dùng 'the number of', không dùng 'the amount of'."),
    ("Uncountable Nouns", "Less commuters used the suburban rail line after ticket prices increased.", "Less commuters", "Fewer commuters", ["Little commuters", "Lesser commuters", "Few commuter"], "Dùng 'Fewer' với danh từ đếm được số nhiều ('commuters'), không dùng 'Less'."),
    ("Uncountable Nouns", "Too many traffic during rush hour increases both fuel waste and stress.", "Too many traffic", "Too much traffic", ["Too several traffic", "Very many traffics", "Too a lot traffic"], "'traffic' là danh từ không đếm được nên phải đi với 'too much'."),
    ("Uncountable Nouns", "The new curriculum gives students practical knowledges about personal finance.", "knowledges", "knowledge", ["a knowledge", "many knowledges", "few knowledge"], "'knowledge' là danh từ không đếm được, không dùng ở dạng số nhiều 'knowledges'."),
    ("Uncountable Nouns", "Passengers are permitted to bring two luggages onto the regional coach.", "two luggages", "two pieces of luggage", ["two luggage", "a few luggages", "many luggages"], "'luggage' không đếm được; muốn nêu số lượng phải dùng 'pieces/items of luggage'."),

    # --- 3. Articles (9) ---
    ("Articles", "The society as a whole benefits when public healthcare is universally accessible.", "The society", "Society", ["A society", "These society", "An society"], "Khi nói đến 'xã hội nói chung' (nghĩa khái quát), không dùng mạo từ 'The' trước 'Society'."),
    ("Articles", "Pollution poses serious threat to marine biodiversity along coastal zones.", "serious threat", "a serious threat", ["the serious threats", "seriously threat", "an serious threat"], "Danh từ đếm được số ít 'threat' bắt buộc phải có mạo từ: 'pose a serious threat to'."),
    ("Articles", "A number of European nations have invested heavily in an renewable energy.", "an renewable energy", "renewable energy", ["a renewable energies", "the renewable energies", "an renewables"], "'renewable' bắt đầu bằng phụ âm /r/ và 'energy' là danh từ không đếm được nói chung -> bỏ 'an'."),
    ("Articles", "According to the chart, the United Kingdom spent more on rail than the France.", "the France", "France", ["a France", "an France", "Frances"], "Không dùng mạo từ 'the' trước tên quốc gia số ít như France, Japan, Vietnam (chỉ dùng với the UK, the US, the Netherlands)."),
    ("Articles", "Students who study abroad gain valuable experience and an unique cultural outlook.", "an unique", "a unique", ["the uniquely", "a uniquely", "one uniquely"], "'unique' phát âm bắt đầu bằng âm phụ âm /j/ (/juːˈniːk/), nên phải dùng 'a unique', không phải 'an'."),
    ("Articles", "The internet has become indispensable tool for modern academic research.", "indispensable tool", "an indispensable tool", ["a indispensable tool", "the indispensable tools", "indispensable tools"], "Danh từ số ít 'tool' cần mạo từ 'an' trước nguyên âm /ɪ/ của 'indispensable'."),
    ("Articles", "Many graduates aspire to work in European Union after completing their master's degree.", "in European Union", "in the European Union", ["in a European Union", "at European Union", "into European Unions"], "Các khối liên minh có danh từ chung như Union, Kingdom, States bắt buộc có 'the'."),
    ("Articles", "Government should invest more in vocational training for unemployed youth.", "Government should", "The government should", ["A governments should", "Governments is", "The government are"], "'Government' ở dạng số ít đếm được cần mạo từ 'The government' (hoặc dùng số nhiều 'Governments')."),
    ("Articles", "Honest discussion is essential; it took over a hour to reach an agreement.", "a hour", "an hour", ["the hours", "one hours", "a hours"], "Chữ 'h' trong 'hour' là âm câm (/ˈaʊə/), nên phải dùng mạo từ 'an hour'."),

    # --- 4. Prepositions (10) ---
    ("Prepositions", "Excessive screen exposure has a negative impact to children's sleep quality.", "impact to", "impact on", ["impact for", "impact with", "impact at"], "Collocation chuẩn luôn là 'have an impact/effect ON something', không dùng 'to'."),
    ("Prepositions", "In my opinion, parents are largely responsible of monitoring their children online.", "responsible of", "responsible for", ["responsible to", "responsible with", "responsible about"], "Cấu trúc chuẩn là 'be responsible FOR + N/V-ing'."),
    ("Prepositions", "The essay will discuss about the economic benefits of remote employment.", "discuss about", "discuss", ["discuss on", "discuss over", "discuss for"], "'discuss' là ngoại động từ đi thẳng với tân ngữ, KHÔNG thêm giới từ 'about'."),
    ("Prepositions", "Many rural clinics suffer a chronic shortage of qualified medical staff.", "suffer a", "suffer from a", ["suffer with a", "suffer by a", "suffer of a"], "Cụm động từ chuẩn khi nói chịu đựng khó khăn/thiếu hụt là 'suffer FROM'."),
    ("Prepositions", "High-speed rail offers an eco-friendly alternative than short-haul domestic flights.", "alternative than", "alternative to", ["alternative with", "alternative for", "alternative against"], "'alternative' luôn đi với giới từ 'to' ('an alternative to X')."),
    ("Prepositions", "Public libraries play a vital role in providing equal access for digital resources.", "access for", "access to", ["access with", "access into", "access at"], "Danh từ 'access' luôn đi với giới từ 'to' ('access to education/resources')."),
    ("Prepositions", "Despite of strict speed limits, road accidents remain common during wet weather.", "Despite of", "Despite", ["In spite", "Although of", "Regardless"], "'Despite' KHÔNG bao giờ đi kèm 'of' (chỉ 'In spite of' mới có 'of')."),
    ("Prepositions", "Urban temperatures rose sharply between 1990 to 2020 across southern Europe.", "between 1990 to 2020", "between 1990 and 2020", ["from 1990 and 2020", "between 1990 until 2020", "during 1990 to 2020"], "Cặp giới từ chuẩn là 'between X AND Y' hoặc 'from X TO Y', tuyệt đối không trộn 'between... to'."),
    ("Prepositions", "Young workers often struggle to cope up with soaring metropolitan housing costs.", "cope up with", "cope with", ["cope about", "cope against", "cope on with"], "Cụm đúng là 'cope with' (đối phó với); không có từ 'up' ở giữa."),
    ("Prepositions", "According to me, subsidising renewable power is the wisest long-term strategy.", "According to me,", "In my view,", ["According to my opinion,", "As to me,", "By my thinking,"], "Trong tiếng Anh học thuật không dùng 'According to me'; dùng 'In my view,' hoặc 'From my perspective,'."),

    # --- 5. Clauses, Conjunctions & Punctuation (10) ---
    ("Clauses & Punctuation", "Although renewable energy is initially costly, but it saves money in the long run.", "costly, but it saves", "costly, it saves", ["costly, however it saves", "costly, yet it saves", "costly, so it saves"], "Trong tiếng Anh không dùng đồng thời cả 'Although' lẫn 'but' trong cùng một câu."),
    ("Clauses & Punctuation", "Public transport is affordable, however, many residents still prefer private cars.", "affordable, however,", "affordable; however,", ["affordable, therefore,", "affordable however", "affordable, but however,"], "'however' là trạng từ liên kết, không nối hai mệnh đề độc lập chỉ bằng dấu phẩy (lỗi comma splice); phải dùng dấu chấm phẩy ';' hoặc dấu chấm '.'."),
    ("Clauses & Punctuation", "Because of air pollution is worsening, several cities have introduced low-emission zones.", "Because of air pollution is worsening,", "Because air pollution is worsening,", ["Due to air pollution is worsening,", "Owing to air pollution is worsening,", "Because of worsening air pollution is,"], "'Because of' chỉ đi với cụm danh từ; trước một mệnh đề có chủ-vị phải dùng 'Because'."),
    ("Clauses & Punctuation", "While working from home reduces commuting time. It can weaken team cohesion.", "time. It can", "time, it can", ["time; it can", "time, and it can", "time. Which can"], "'While + mệnh đề' là mệnh đề phụ, không được tách thành câu độc lập (lỗi sentence fragment)."),
    ("Clauses & Punctuation", "Because traffic congestion wastes hours daily, so employers should allow flexible start times.", "daily, so employers", "daily, employers", ["daily, therefore employers", "daily, thus employers", "daily, and so employers"], "Không dùng đồng thời cả 'Because' và 'so' trong cùng một câu."),
    ("Clauses & Punctuation", "Even though the high tuition fees, demand for overseas degrees continues to climb.", "Even though the high tuition fees,", "Despite the high tuition fees,", ["Although the high tuition fees,", "Whereas the high tuition fees,", "Even if the high tuition fees,"], "'Even though' cần một mệnh đề đầy đủ; trước cụm danh từ 'the high tuition fees' phải dùng 'Despite'."),
    ("Clauses & Punctuation", "The reason why obesity is rising is because processed food is cheap and convenient.", "is because", "is that", ["is due to because", "is why", "is since"], "Tránh lặp nghĩa 'The reason ... is because'; cấu trúc chuẩn là 'The reason ... is that...'."),
    ("Clauses & Punctuation", "Not only the new metro line eases congestion, but it also lowers carbon emissions.", "Not only the new metro line eases", "Not only does the new metro line ease", ["Not only did the new metro line eases", "Not only is the new metro line ease", "Not only does the new metro line eases"], "Khi 'Not only' đứng đầu câu, bắt buộc phải đảo ngữ: 'Not only + does/do/did + S + V nguyên thể'."),
    ("Clauses & Punctuation", "Many graduates lack practical skills, therefore, universities should expand internships.", "skills, therefore,", "skills; therefore,", ["skills therefore", "skills, consequently,", "skills, so therefore,"], "Tránh lỗi comma splice với 'therefore': dùng dấu chấm phẩy trước và dấu phẩy sau ('; therefore,')."),
    ("Clauses & Punctuation", "Whether cities expand bike lanes or not depend largely on political willpower.", "depend", "depends", ["are depending", "were depended", "depending"], "Mệnh đề danh ngữ 'Whether...' làm chủ ngữ luôn chia động từ số ít ('depends')."),

    # --- 6. Word Form & Parts of Speech (9) ---
    ("Word Form", "Expanding rural broadband can significant improve access to university courses.", "significant improve", "significantly improve", ["significance improve", "signify improve", "significant improving"], "Cần trạng từ 'significantly' để bổ nghĩa cho động từ 'improve', không dùng tính từ 'significant'."),
    ("Word Form", "Governments must take decisive act to protect coastal wetlands from erosion.", "decisive act", "decisive action", ["decisive active", "decisively action", "decisive acting"], "Collocation chuẩn là 'take decisive action' (danh từ không đếm được 'action')."),
    ("Word Form", "The economic of renewable energy has shifted dramatically over the past decade.", "The economic of", "The economics of", ["The economical of", "An economic of", "The economy's of"], "'economics' (danh từ, chia số ít) chỉ khía cạnh/bài toán kinh tế; 'economic' chỉ là tính từ."),
    ("Word Form", "Electric scooters provide a very economy way to travel short urban distances.", "economy way", "economical way", ["economic way", "economically way", "economies way"], "'economical' nghĩa là tiết kiệm chi phí; khác với 'economic' (thuộc nền kinh tế) và danh từ 'economy'."),
    ("Word Form", "Long working hours can have a harm effect on parents' relationships with children.", "harm effect", "harmful effect", ["harmfully effect", "harmed effect", "harming effect"], "Trước danh từ 'effect' cần tính từ 'harmful', không dùng danh từ/động từ 'harm'."),
    ("Word Form", "Rapid urbanisation has led to the destroy of valuable agricultural land.", "the destroy of", "the destruction of", ["the destructive of", "the destroying to", "a destroy of"], "Sau mạo từ 'the' và trước 'of' phải dùng danh từ 'destruction'."),
    ("Word Form", "Regular exercise is extreme beneficial for both physical stamina and mood.", "extreme beneficial", "extremely beneficial", ["extremity beneficial", "extreme benefit", "extremely benefit"], "Bổ nghĩa cho tính từ 'beneficial' phải dùng trạng từ 'extremely'."),
    ("Word Form", "A lack of sleep can make drivers feel tiring and slow their reaction speed.", "feel tiring", "feel tired", ["feel tire", "feel tiredness", "feeling tiredly"], "Tính từ mô tả cảm xúc con người dùng đuôi -ed ('tired'), không dùng -ing ('tiring' mô tả vật/việc gây mệt)."),
    ("Word Form", "Schools should teach students how to evaluate online news sources critical.", "sources critical", "sources critically", ["sources critic", "sources criticism", "sources criticalness"], "Bổ nghĩa cho động từ 'evaluate' cần trạng từ 'critically'."),

    # --- 7. Task 1 Verbs, Tenses & Numbers (10) ---
    ("Task 1 Accuracy", "Between 2000 and 2010, the price of wheat raised sharply from $120 to $260 per tonne.", "raised sharply", "rose sharply", ["risen sharply", "was raised sharply", "arised sharply"], "'rise' là nội động từ (tự tăng -> quá khứ 'rose'); 'raise' là ngoại động từ cần tân ngữ đi sau."),
    ("Task 1 Accuracy", "The proportion of solar power was increased from 4% in 2010 to 19% in 2020.", "was increased", "increased", ["had been increased", "is increased", "was increasing to"], "Động từ mô tả xu hướng số liệu như increase, rise, fall, drop dùng ở dạng chủ động, không dùng bị động."),
    ("Task 1 Accuracy", "By 2035, electric vehicle sales are expecting to surpass petrol models.", "are expecting to", "are expected to", ["expecting to", "will expected to", "are expect to"], "Dự báo tương lai ở Task 1 phải dùng bị động 'be expected/projected to + V'."),
    ("Task 1 Accuracy", "In 1995, the unemployment rate was stood at 8.5% before falling gradually.", "was stood at", "stood at", ["is stood at", "had been stood at", "was standing on"], "'stand at' là nội động từ không bao giờ chia bị động ('stood at', không phải 'was stood at')."),
    ("Task 1 Accuracy", "Over the twenty-year period, coal usage fell dramatically to 30% to 10%.", "to 30% to 10%", "from 30% to 10%", ["at 30% to 10%", "between 30% to 10%", "by 30% to 10%"], "Diễn tả điểm bắt đầu và kết thúc của sự thay đổi dùng 'from X to Y'."),
    ("Task 1 Accuracy", "The number of museum visitors peaked in 4.2 million in July 2019.", "peaked in", "peaked at", ["peaked to", "peaked on", "peaked by"], "Động từ 'peak' luôn đi với giới từ 'at' trước con số ('peaked at 4.2 million')."),
    ("Task 1 Accuracy", "In 2015, Japan spent 20 percents of its energy budget on wind turbines.", "20 percents", "20 percent", ["20 percentage", "20% percent", "20 per cents"], "'percent' không bao giờ thêm -s khi đi sau con số ('20 percent' hoặc '20%')."),
    ("Task 1 Accuracy", "The chart illustrates the amount of households owning electric bicycles since 2015.", "the amount of households", "the number of households", ["the quantity of households", "an amount of household", "the total amount for households"], "'households' đếm được nên phải dùng 'the number of households'."),
    ("Task 1 Accuracy", "There was a significantly increase in online grocery orders during 2020.", "a significantly increase", "a significant increase", ["a significance increase", "an significantly increase", "a significant increasing"], "Trước danh từ 'increase' phải là tính từ 'significant', không dùng trạng từ 'significantly'."),
    ("Task 1 Accuracy", "The figure for France was twice higher than that for Italy in 2018.", "twice higher than", "twice as high as", ["two times higher as", "double higher than", "twice more high than"], "So sánh gấp đôi không dùng 'twice higher than'; cấu trúc chuẩn là 'twice as high as'."),

    # --- 8. Passive Voice & Verb Patterns (8) ---
    ("Verb Patterns", "The new recycling plant was built in 2018 and has been operate smoothly ever since.", "has been operate", "has operated", ["has been operated by", "is operate", "was operating"], "'operate' mang nghĩa vận hành chủ động ở đây -> dùng thì hiện tại hoàn thành 'has operated'."),
    ("Verb Patterns", "Higher fuel taxes can discourage motorists to drive into congested city centres.", "discourage motorists to drive", "discourage motorists from driving", ["discourage motorists driving", "discourage motorists for driving", "discourage motorists of driving"], "Cấu trúc bắt buộc của 'discourage' là 'discourage sb FROM + V-ing'."),
    ("Verb Patterns", "Subsidised rail passes encourage commuters switching from private cars to trains.", "encourage commuters switching", "encourage commuters to switch", ["encourage commuters switch", "encourage commuters for switching", "encourage commuters into switch"], "'encourage + O + to V' (khác với 'discourage + O + from V-ing')."),
    ("Verb Patterns", "The municipal council suggested to expand evening bus services along outer routes.", "suggested to expand", "suggested expanding", ["suggested for expanding", "suggested to expanding", "suggested expand"], "Động từ 'suggest' đi với V-ing ('suggested expanding') hoặc 'suggest that + S + V', KHÔNG dùng 'suggest to V'."),
    ("Verb Patterns", "Strict workplace laws prevent employers to underpay part-time university staff.", "prevent employers to underpay", "prevent employers from underpaying", ["prevent employers underpaying", "prevent employers for underpaying", "prevent employers against underpay"], "Cấu trúc chuẩn là 'prevent + O + FROM + V-ing'."),
    ("Verb Patterns", "Many developing regions cannot afford building high-speed rail networks independently.", "afford building", "afford to build", ["afford for building", "afford build", "afford in building"], "'afford' luôn đi với động từ nguyên thể có to ('afford to V')."),
    ("Verb Patterns", "The workshop enabled graduate students developing practical data visualisation skills.", "enabled graduate students developing", "enabled graduate students to develop", ["enabled graduate students develop", "enabled graduate students for developing", "enabled to develop graduate students"], "Cấu trúc chuẩn là 'enable + O + to V'."),
    ("Verb Patterns", "After the raw timber is shredded, it is transport to a heated drying chamber.", "is transport", "is transported", ["is transporting", "was transport", "has transport"], "Thể bị động bắt buộc dùng phân từ quá khứ V3/ed ('is transported')."),

    # --- 9. Relative Clauses & Pronoun Reference (8) ---
    ("Relative Clauses", "Public parks, that provide vital cooling in summer, deserve greater municipal funding.", ", that provide", ", which provide", [", what provide", ", who provide", ", where provide"], "Mệnh đề quan hệ không xác định (có dấu phẩy) TUYỆT ĐỐI không dùng 'that'; phải dùng 'which'."),
    ("Relative Clauses", "Students which graduate with strong digital skills tend to secure employment faster.", "Students which", "Students who", ["Students whom", "Students whose", "Students what"], "Thay thế cho chủ ngữ chỉ người ('Students') phải dùng 'who' (hoặc 'that'), không dùng 'which'."),
    ("Relative Clauses", "Remote work cuts daily commuting time, what significantly improves family wellbeing.", ", what significantly", ", which significantly", [", that significantly", ", where significantly", ", who significantly"], "Đại từ quan hệ thay thế cho cả mệnh đề đứng trước là ', which', không dùng ', what'."),
    ("Relative Clauses", "The city where I visited last autumn has transformed its waterfront into a park.", "where I visited", "that I visited", ["which I visited it", "where I visited there", "in which I visited"], "'visit' là ngoại động từ cần tân ngữ trực tiếp -> dùng 'that/which I visited', không dùng 'where'."),
    ("Relative Clauses", "Small firms whose revenues fell sharply during the crisis received emergency grants, which helped it survive.", "helped it survive", "helped them survive", ["helped its survive", "helped they survive", "helped itself survive"], "Danh từ quy chiếu là 'Small firms' (số nhiều) nên đại từ phải là 'them', không phải 'it'."),
    ("Relative Clauses", "The policy applies to all residents who their annual income falls below the threshold.", "who their annual income", "whose annual income", ["whom annual income", "which annual income", "who's annual income"], "Diễn đạt quan hệ sở hữu trong mệnh đề quan hệ dùng 'whose + danh từ'."),
    ("Relative Clauses", "There are many online platforms in where learners can practise spoken English.", "in where", "where", ["at where", "to where", "which in"], "'where' đã bao hàm giới từ ('in which'); không bao giờ viết 'in where'."),
    ("Relative Clauses", "The report highlights several cities in Europe which public transport is entirely free.", "which public transport", "in which public transport", ["that public transport", "who public transport", "whom public transport"], "Mệnh đề sau đã đủ chủ-vị-bổ ngữ ('public transport is free') nên cần 'where' hoặc 'in which'."),

    # --- 10. Conditionals & Inversion (8) ---
    ("Conditionals & Inversion", "If governments would invest more in preventative care, hospital costs would decline.", "would invest", "invested", ["will invest", "had invested", "investing"], "Trong mệnh đề 'If' của câu điều kiện loại 2 chỉ dùng quá khứ đơn ('invested'), không dùng 'would'."),
    ("Conditionals & Inversion", "Had cities upgraded flood barriers earlier, the coastal damage would not be so severe last year.", "would not be", "would not have been", ["will not have been", "had not been", "would not had been"], "Sự việc xảy ra 'last year' (quá khứ) nên vế chính điều kiện loại 3 phải là 'would not have been'."),
    ("Conditionals & Inversion", "Seldom policymakers confront a challenge as complex as demographic ageing.", "Seldom policymakers confront", "Seldom do policymakers confront", ["Seldom are policymakers confront", "Seldom policymakers do confront", "Seldom did policymakers confronted"], "Trạng từ phủ định 'Seldom' đứng đầu câu bắt buộc đảo trợ động từ: 'Seldom do policymakers confront'."),
    ("Conditionals & Inversion", "Only when consumers change their habits will companies to adopt sustainable packaging.", "will companies to adopt", "will companies adopt", ["companies will adopt", "will companies adopting", "do companies to adopt"], "Sau động từ khuyết thiếu 'will' là động từ nguyên thể không to ('adopt')."),
    ("Conditionals & Inversion", "Were tuition fees to be abolished completely, university budgets will face severe shortfalls.", "will face", "would face", ["faced", "have faced", "facing"], "'Were ... to V' là đảo ngữ điều kiện loại 2, nên vế chính phải dùng 'would + V', không dùng 'will'."),
    ("Conditionals & Inversion", "Unless strict emission targets are not enforced, industrial pollution will keep rising.", "are not enforced", "are enforced", ["will not be enforced", "were not enforced", "not enforcing"], "'Unless' bản thân đã mang nghĩa phủ định ('If ... not'), nên tuyệt đối không thêm 'not' phía sau."),
    ("Conditionals & Inversion", "Never before the global economy has been so closely interconnected.", "the global economy has been", "has the global economy been", ["did the global economy been", "was the global economy been", "has been the global economy"], "Cụm phủ định 'Never before' đứng đầu câu bắt buộc đảo 'has' lên trước chủ ngữ."),
    ("Conditionals & Inversion", "Should the pilot programme succeeds, the council will expand it to ten districts.", "succeeds", "succeed", ["succeeded", "succeeding", "to succeed"], "Trong đảo ngữ điều kiện loại 1 'Should + S + V', động từ chính luôn ở dạng nguyên thể ('succeed')."),

    # --- 11. Collocation, Register & Vietlish Traps (8) ---
    ("Collocation & Register", "Rapid technological change brings a lot of big problems for older workers.", "a lot of big problems", "significant challenges", ["tons of huge troubles", "lots of heavy problems", "many large bad things"], "Tránh văn nói 'a lot of big problems' trong IELTS Writing; dùng 'significant challenges'."),
    ("Collocation & Register", "Governments must do stronger efforts to curb illegal logging in protected forests.", "do stronger efforts", "make greater efforts", ["give harder efforts", "take bigger efforts", "create strong efforts"], "Collocation chuẩn của 'effort' là 'make an effort / make efforts', không dùng 'do'."),
    ("Collocation & Register", "Spending excessive time on smartphones can make harm to young people's eyesight.", "make harm to", "cause harm to", ["do damage on", "give harm for", "bring harm at"], "Dùng 'cause harm to' hoặc 'do harm to', không dùng 'make harm to'."),
    ("Collocation & Register", "Many young graduates struggle to find a high salary job straight after university.", "a high salary job", "a well-paid job", ["a tall salary job", "an expensive salary work", "a big wage career"], "Cụm tự nhiên chuẩn bản xứ là 'a well-paid job' hoặc 'a lucrative career'."),
    ("Collocation & Register", "Nowadays, technology is very convenient for students to open their mind.", "open their mind", "broaden their horizons", ["widen their brain", "enlarge their thinking", "expand their head"], "Tránh dịch word-by-word từ tiếng Việt ('mở mang đầu óc'); dùng 'broaden their horizons'."),
    ("Collocation & Register", "It is undeniable that urban green spaces bring lots of merits for city dwellers.", "bring lots of merits for", "offer numerous benefits to", ["give plenty merits to", "make many advantages for", "take lots of benefits to"], "Tránh 'lots of' và lỗi giới từ; dùng 'offer numerous benefits to'."),
    ("Collocation & Register", "Students should pay more attention on developing critical thinking rather than rote memorisation.", "pay more attention on", "pay greater attention to", ["put more attention in", "give bigger attention at", "make more attention to"], "Collocation cố định là 'pay attention TO', không dùng 'on'."),
    ("Collocation & Register", "In my opinion, parents must take a good example for their children to follow.", "take a good example", "set a good example", ["make a fine example", "give a good sample", "do a positive example"], "Collocation chuẩn để nói 'làm gương tốt' là 'set a good example', không dùng 'take'."),

    # --- 12. Comparisons, Modifiers & Parallelism (8) ---
    ("Comparisons & Parallelism", "Public rail networks are far more efficient and cleaner than private motorways.", "more efficient and cleaner", "more efficient and cleaner", ["efficienter and more clean", "more efficient and more clean", "most efficient and cleanest"], "placeholder"),
]

# Replace the placeholder cleanly and add the remaining 8 items for section 12
WRITING_ERROR_FIXES_DATA.pop()
WRITING_ERROR_FIXES_DATA.extend([
    ("Comparisons & Parallelism", "Electric buses are significantly more quieter and cleaner than diesel fleets.", "more quieter", "quieter", ["more quiet", "most quieter", "quietest"], "Không dùng so sánh kép 'more' với tính từ ngắn đã thêm -er ('quieter')."),
    ("Comparisons & Parallelism", "The cost of living in central London is much higher than Manchester.", "than Manchester", "than that in Manchester", ["than Manchester's cost", "as that in Manchester", "compared Manchester"], "So sánh phải đồng đẳng: so sánh 'The cost of living' với 'that in Manchester', không so sánh giá cả với thành phố."),
    ("Comparisons & Parallelism", "A balanced diet helps improve concentration, boosting immunity, and sleep quality.", "boosting immunity, and sleep quality", "boost immunity, and enhance sleep quality", ["to boost immunity, and sleep", "boosted immunity, and sleeping", "boosting immune, and quality sleep"], "Cấu trúc song song (parallelism): 'improve X, boost Y, and enhance Z' cùng dạng động từ nguyên thể."),
    ("Comparisons & Parallelism", "Walking to work every morning, the air quality felt noticeably fresher along the river.", "the air quality felt", "commuters noticed that the air felt", ["the air was feeling", "it felt the air quality", "river air felt"], "Lỗi dangling modifier: 'Walking to work' phải bổ nghĩa cho chủ ngữ là con người ('commuters'), không phải 'the air quality'."),
    ("Comparisons & Parallelism", "Solar panels are now far more cheaper to install than they were fifteen years ago.", "more cheaper", "cheaper", ["most cheaper", "more cheap", "cheapest"], "Không ghép 'more' với 'cheaper'; chỉ dùng 'far cheaper'."),
    ("Comparisons & Parallelism", "Online platforms allow learners to study flexibly, saving commute time, and access global lectures.", "saving commute time,", "save commute time,", ["to saving commute time,", "saved commute time,", "having saved commute time,"], "Đảm bảo song song sau 'allow learners to': 'study..., save..., and access...'."),
    ("Comparisons & Parallelism", "Compared with the older generation, young adults' digital literacy is far higher.", "young adults' digital literacy", "young adults possess far higher digital literacy", ["digital literacy of young adults", "the digital literacy for youth", "young adults' literacy"], "Sau 'Compared with the older generation,', chủ ngữ mệnh đề chính phải là con người ('young adults'), không phải 'digital literacy'."),
    ("Comparisons & Parallelism", "This scheme is not only beneficial for rural farmers but also urban consumers.", "not only beneficial for rural farmers", "beneficial not only for rural farmers", ["not only benefit for rural farmers", "beneficial for not only rural", "not only beneficial to rural"], "Cấu trúc song song 'not only ... but also': đặt 'not only' ngay trước 'for rural farmers' để cân với 'but also (for) urban consumers'."),
])


def build_writing_error_fixes() -> list[dict]:
    items: list[dict] = []
    for idx, (cat, err_sent, err_span, corr, distractors, expl) in enumerate(WRITING_ERROR_FIXES_DATA, start=1):
        assert err_span in err_sent, f"errorSpan '{err_span}' not in '{err_sent}'"
        assert err_span != corr, f"errorSpan equals correction in '{err_sent}'"
        full_correct = err_sent.replace(err_span, corr, 1)
        items.append(
            {
                "id": f"wfix_{idx:03d}",
                "category": cat,
                "sentenceWithError": err_sent,
                "errorSpan": err_span,
                "correction": corr,
                "distractors": distractors,
                "fullCorrectSentence": full_correct,
                "explanationVi": expl,
            }
        )
    return items


# ==============================================================================
# SECTION 6: SPEAKING NATURAL PHRASES & IDIOMS (>= 50 items)
# ==============================================================================

# Map Anki cloze phrase -> (ipa, band6Equivalent, questionPrompt, distractors, explanationVi)
ANKI_SPEAKING_PHRASE_MAP: dict[str, tuple[str, str, str, list[str], str]] = {
    "That's an interesting question.": (
        "/ðæts ən ˈɪntrəstɪŋ ˈkwestʃən/",
        "Wait, let me see.",
        "Do you think traditional museums will still be relevant fifty years from now?",
        ["That's a boring question.", "I don't know the answer.", "Can you repeat the question?"],
        "Câu giờ tự nhiên chuẩn bản xứ ở Part 3 giúp bạn có thêm 2–3 giây sắp xếp ý mà không bị trừ điểm Fluency."
    ),
    "Let me think for a second.": (
        "/let mi θɪŋk fər ə ˈsekənd/",
        "Umm... wait a minute.",
        "What kind of public facilities do you think your hometown needs most?",
        ["Give me five minutes.", "I forgot everything.", "Stop and wait for me."],
        "Thay thế tự nhiên cho tiếng ngập ngừng 'umm/err' khi cần vài giây suy nghĩ."
    ),
    "Off the top of my head": (
        "/ɒf ðə tɒp əv maɪ hed/",
        "I guess quickly",
        "How often do you cook meals at home during a typical week?",
        ["Out of my brain", "On the surface of my mind", "From the roof of my head"],
        "Thành ngữ tự nhiên dùng khi đưa ra con số hoặc ví dụ ước lượng ngay lập tức mà không cần kiểm chứng."
    ),
    "I'd have to say": (
        "/aɪd hæv tə seɪ/",
        "I think",
        "Which season of the year do you enjoy the most?",
        ["I must to speak", "I have to tell", "I would speaking"],
        "Cụm mở câu trả lời cực kỳ tự nhiên và linh hoạt, nâng cấp mượt mà cho 'I think' lặp đi lặp lại."
    ),
    "As far as I'm concerned": (
        "/æz fɑːr əz aɪm kənˈsɜːnd/",
        "In my opinion",
        "Should public transport in big cities be funded entirely by taxes?",
        ["As long as I care", "So far as I concern", "As much as I worry"],
        "Cụm nêu quan điểm trang trọng và rõ ràng, rất hợp với các câu hỏi xã hội Part 3."
    ),
    "I'm a firm believer that": (
        "/aɪm ə fɜːm bɪˈliːvə ðæt/",
        "I strongly think that",
        "Should practical life skills like cooking be taught in secondary schools?",
        ["I'm a hard thinker that", "I'm a strong knower that", "I believe firmly about"],
        "Thể hiện lập trường dứt khoát và tự tin bằng collocation chuẩn Band 8.0 ('a firm believer')."
    ),
    "I'm in two minds about": (
        "/aɪm ɪn tuː maɪndz əˈbaʊt/",
        "I am not sure about",
        "Do you think social media brings people closer together or pushes them apart?",
        ["I have double brains on", "I'm in half mind for", "I split two thoughts about"],
        "Thành ngữ tự nhiên diễn tả việc nhìn thấy cả hai mặt lợi–hại của vấn đề."
    ),
    "It depends on": (
        "/ɪt dɪˈpendz ɒn/",
        "Sometimes yes, sometimes no",
        "Is it better to work for a large corporation or a small startup?",
        ["It relies for", "It connects on", "It decides by"],
        "Công cụ rào đón số 1 ở Part 3 giúp bạn triển khai câu trả lời hai nhánh rõ ràng."
    ),
    "Generally speaking": (
        "/ˈdʒenrəli ˈspiːkɪŋ/",
        "Usually",
        "Do older people and young people communicate differently in your country?",
        ["Commonly talking", "Normally saying", "Broadly telling"],
        "Dùng để khái quát xu hướng xã hội mà không khẳng định tuyệt đối 100%."
    ),
    "To some extent": (
        "/tə sʌm ɪkˈstent/",
        "A little bit yes",
        "Do you agree that money is the main factor in career happiness?",
        ["At some level", "In some size", "For some degree"],
        "Cụm đồng ý một phần giúp bạn mở đường cho vế phản biện 'but there are exceptions'."
    ),
    "tend to": (
        "/tend tuː/",
        "always",
        "How have leisure habits changed in cities over recent years?",
        ["intend to", "pretend to", "attend to"],
        "Động từ 'tend to + V' giúp khái quát xu hướng một cách chừng mực và chính xác."
    ),
    "Back when I was a kid": (
        "/bæk wen aɪ wəz ə kɪd/",
        "When I was young",
        "How did children spend their free time in the past compared to today?",
        ["Behind when I was child", "Before when I am kid", "Past time I was young"],
        "Cách kể chuyện quá khứ tự nhiên chuẩn bản xứ, dùng mượt trong cả Part 1 lẫn Part 2."
    ),
    "used to": (
        "/ˈjuːst tuː/",
        "in the past always",
        "Have reading habits among children changed much in recent decades?",
        ["using to", "use to", "were used to"],
        "Cấu trúc 'used to + V' đối chiếu cực hiệu quả với 'whereas nowadays' khi so sánh quá khứ–hiện tại."
    ),
    "Compared to": (
        "/kəmˈpeəd tuː/",
        "Different from",
        "How has your hometown changed over the last twenty years?",
        ["Comparing against", "Compare with", "In comparing to"],
        "Mở câu so sánh rõ ràng ở đầu câu; có thể nâng cấp thêm bằng 'Compared to twenty years ago...'."
    ),
    "I'd imagine that": (
        "/aɪd ɪˈmædʒɪn ðæt/",
        "Maybe in the future",
        "How do you think working patterns will evolve over the next twenty years?",
        ["I would dream that", "I'm imagining to", "I suppose imagine"],
        "Dự đoán tương lai nhẹ nhàng, tự nhiên và giàu sắc thái giả định."
    ),
    "It's quite likely that": (
        "/ɪts kwaɪt ˈlaɪkli ðæt/",
        "Maybe yes",
        "Will artificial intelligence replace many administrative jobs in the near future?",
        ["It's very maybe that", "It's quite liking that", "It's possibly likely"],
        "Diễn tả xác suất cao một cách khách quan trong các câu hỏi dự đoán Part 3."
    ),
    "There's a good chance": (
        "/ðeəz ə ɡʊd tʃɑːns/",
        "Probably",
        "Do you think electric cars will become dominant in your country soon?",
        ["There's a big luck", "It has a nice chance", "There's a good opportunity that"],
        "Cụm văn nói tự nhiên cực kỳ bản xứ tương đương 'It is very probable that'."
    ),
    "For example": (
        "/fər ɪɡˈzɑːmpl/",
        "Like",
        "Why do many urban commuters feel stressed during the working week?",
        ["By example", "As example", "In example"],
        "Đưa ví dụ cá nhân cụ thể (tên thành phố, người quen) giúp câu trả lời sống động và thuyết phục."
    ),
    "Take": (
        "/teɪk/",
        "Look at",
        "How has urban development transformed towns in your country?",
        ["Bring", "Catch", "Hold"],
        "Cấu trúc 'Take X, for instance:' là cách nêu ví dụ mở rộng đặc trưng của người nói Band 8.0+."
    ),
    "What I mean is": (
        "/wɒt aɪ miːn ɪz/",
        "I want to say",
        "Why do people rely more on takeaway food these days?",
        ["Which I mean is", "What my meaning is", "That I mean is"],
        "Cụm diễn giải lại ý cho rõ ràng hơn, giúp kéo dài câu trả lời tự nhiên."
    ),
    "I can't think of the exact word, but": (
        "/aɪ kɑːnt θɪŋk əv ði ɪɡˈzækt wɜːd bʌt/",
        "Sorry I forgot the word",
        "Can you describe a traditional craft or tool used in your region?",
        ["I lost my vocabulary, so", "I don't remember English for it", "My mind is blank now"],
        "Kỹ năng paraphrase khi bí từ (circumlocution) — giám khảo đánh giá rất cao khả năng xoay xở mượt mà này."
    ),
    "Or rather": (
        "/ɔː ˈrɑːðə(r)/",
        "No, I mean",
        "Was preparing for your university entrance exam difficult?",
        ["Or better say", "Rather saying", "Or more truly"],
        "Cụm tự điều chỉnh ý cho sắc sảo và chính xác hơn mà không làm đứt mạch nói."
    ),
    "On top of that": (
        "/ɒn tɒp əv ðæt/",
        "Also",
        "Why do you enjoy taking the metro instead of riding a motorbike?",
        ["Above of that", "On the head of that", "At top of this"],
        "Từ nối bổ sung ý cực kỳ tự nhiên trong văn nói, tránh lạm dụng 'Moreover/Furthermore' quá cứng nhắc."
    ),
    "Having said that": (
        "/ˈhævɪŋ sed ðæt/",
        "But",
        "Do you think living in a big metropolis is better than living in a small town?",
        ["After saying it", "Had said that", "Saying that before"],
        "Cụm chuyển ý tương phản đẳng cấp Band 8.0, thay thế tuyệt vời cho 'However' trong Speaking."
    ),
    "That's why": (
        "/ðæts waɪ/",
        "So",
        "How do you usually commute to work or university?",
        ["That's because why", "This is the reason why so", "Which is why for"],
        "Chốt lại nguyên nhân–kết quả gọn gàng, tự nhiên trong cả Part 1 và Part 3."
    ),
    "The main reason is that": (
        "/ðə meɪn ˈriːzn ɪz ðæt/",
        "Because mainly",
        "Why do you prefer studying in the morning rather than late at night?",
        ["The main reason is because", "The chief reason why because", "The mostly reason is"],
        "Nhớ dùng 'The main reason is THAT', tránh lỗi 'is because'."
    ),
    "over the moon": (
        "/ˌəʊvə ðə ˈmuːn/",
        "very happy",
        "Describe a piece of good news you received recently.",
        ["above the sun", "under the stars", "beyond the sky"],
        "Idiom tự nhiên chỉ cảm giác vỡ òa hạnh phúc; dùng đúng 1 lần trong câu chuyện Part 2 sẽ rất đắt giá."
    ),
    "a bit nervous at first": (
        "/ə bɪt ˈnɜːvəs ət fɜːst/",
        "scared in the beginning",
        "Describe a time when you tried a challenging new activity.",
        ["a little worrying firstly", "bit nervous at start", "slightly scary on first"],
        "Cặp diễn biến cảm xúc 'a bit nervous at first, but I soon got used to it' giúp bài kể chuyện Part 2 có chiều sâu."
    ),
    "left a lasting impression on me": (
        "/left ə ˈlɑːstɪŋ ɪmˈpreʃn ɒn mi/",
        "I still remember it well",
        "Describe an unforgettable trip or event you experienced.",
        ["gave a long print to me", "made a forever feeling on me", "put a lasting mark in me"],
        "Collocation chốt bài Part 2 cực kỳ tự nhiên và giàu cảm xúc."
    ),
    "I'm really into": (
        "/aɪm ˈrɪəli ˈɪntuː/",
        "I like very much",
        "What do you like doing in your spare time on weekends?",
        ["I'm very inside", "I'm strongly onto", "I'm deeply in"],
        "Cách nói 'rất mê/rất thích' chuẩn văn nói bản xứ, ăn điểm hơn nhiều so với 'I like... very much'."
    ),
    "It's not really my cup of tea": (
        "/ɪts nɒt ˈrɪəli maɪ kʌp əv tiː/",
        "I don't like it",
        "Do you enjoy going to loud nightclubs or crowded concerts?",
        ["It's not my glass of water", "It's not my mug of coffee", "It doesn't match my tea"],
        "Thành ngữ nhẹ nhàng, lịch sự khi nói điều gì đó không hợp gu mình."
    ),
    "I'd rather": (
        "/aɪd ˈrɑːðə(r)/",
        "I like ... more than ...",
        "Do you prefer quiet evenings at home or big social parties?",
        ["I'd prefer than", "I rather to", "I would rathering"],
        "Cấu trúc 'I'd rather + V nguyên thể + than + V nguyên thể' gọn gàng và chuẩn ngữ pháp."
    ),
    "I'm going to talk about": (
        "/aɪm ˈɡəʊɪŋ tə tɔːk əˈbaʊt/",
        "Today my topic is",
        "Describe a memorable journey you went on.",
        ["I will tell about", "I am talking of", "Let me speech about"],
        "Câu mở đầu Part 2 tự nhiên, không bị kiểu thuộc lòng máy móc như 'Today I would like to present...'."
    ),
    "The reason it stands out": (
        "/ðə ˈriːzn ɪt stændz aʊt/",
        "Why it is special",
        "Why was that trip more memorable than other holidays you have taken?",
        ["The reason it stays up", "Why it pops outside", "The cause it sits out"],
        "Cụm động từ 'stand out' (nổi bật, đáng nhớ) giúp nhấn mạnh trọng tâm phần cuối cue card Part 2."
    ),
    "All in all": (
        "/ɔːl ɪn ɔːl/",
        "In conclusion",
        "How would you sum up your overall impression of that experience?",
        ["All of all", "In all total", "All by all"],
        "Cụm tổng kết tự nhiên đặc trưng cho Speaking Part 2 (tự nhiên hơn 'In conclusion' của Writing)."
    ),
}

EXTRA_SPEAKING_PHRASES: list[tuple[str, str, str, str, str, str, list[str], str]] = [
    # (phrase, ipa, meaningVi, band6Equivalent, questionPrompt, sampleSentence, distractors, explanationVi)
    ("a double-edged sword", "/ə ˌdʌbl edʒd ˈsɔːd/", "con dao hai lưỡi", "has both good and bad sides", "How has artificial intelligence affected university students?", "Honestly, AI is a double-edged sword: it speeds up research, yet it can tempt students to skip real thinking.", ["a two-sided knife", "a split blade", "a twin sword"], "Thành ngữ chuẩn học thuật dùng được trong cả Speaking Part 3 lẫn Writing Task 2."),
    ("hit the ground running", "/hɪt ðə ɡraʊnd ˈrʌnɪŋ/", "bắt nhịp công việc ngay lập tức", "start working very fast", "Describe your first week at a new job or university course.", "Thanks to the orientation workshop, I managed to hit the ground running in my very first week.", ["touch the floor jogging", "run on the earth fast", "jump the ground early"], "Idiom tự nhiên khi kể về quá trình thích nghi nhanh với môi trường mới."),
    ("recharge my batteries", "/ˌriːˈtʃɑːdʒ maɪ ˈbætəriz/", "nạp lại năng lượng, nghỉ ngơi hồi sức", "rest and get energy back", "What do you usually do to unwind after a stressful week?", "Going for a quiet walk by the lake is the best way for me to recharge my batteries.", ["refill my power bank", "reload my electricity", "charge up my cells"], "Cụm ẩn dụ cực kỳ bản xứ cho chủ đề nghỉ ngơi, du lịch và cân bằng cuộc sống."),
    ("a breath of fresh air", "/ə breθ əv freʃ eə(r)/", "làn gió mới đầy sảng khoái", "something new and refreshing", "Describe a teacher or colleague whose style you admired.", "Her interactive workshops were a breath of fresh air compared to traditional textbook lectures.", ["a wind of clean sky", "an inhale of cool breeze", "a puff of pure oxygen"], "Dùng để khen ngợi con người, địa điểm hoặc cách làm mới mẻ, đầy hứng khởi."),
    ("burn the midnight oil", "/bɜːn ðə ˈmɪdnaɪt ɔɪl/", "thức khuya học tập/làm việc miệt mài", "stay up very late studying", "Describe a time you prepared hard for an important deadline.", "I had to burn the midnight oil for almost two weeks to polish my final dissertation.", ["light the night candle", "fire the late gas", "cook the dark lamp"], "Thành ngữ kinh điển khi kể về giai đoạn ôn thi hoặc chạy deadline."),
    ("on the same wavelength", "/ɒn ðə seɪm ˈweɪvleŋθ/", "cùng tần số, rất hợp cạ nhau", "think in the same way", "Describe a close friend you get along with effortlessly.", "Even though we live in different cities now, we're still completely on the same wavelength whenever we catch up.", ["at the equal signal", "on the same radio line", "in the same frequency"], "Cụm tự nhiên tuyệt đẹp cho cue card Describe a friend / person."),
    ("cost an arm and a leg", "/kɒst ən ɑːm ənd ə leɡ/", "đắt cắt cổ", "very expensive", "Is housing affordable for young people in your city?", "Renting even a tiny studio downtown can cost an arm and a leg nowadays.", ["pay a hand and foot", "cost a head and toe", "price two arms"], "Thành ngữ văn nói cực phổ biến cho chủ đề giá cả, nhà ở và du lịch."),
    ("down-to-earth", "/ˌdaʊn tu ˈɜːθ/", "gần gũi, thực tế, không màu mè", "friendly and modest", "What qualities do you admire most in a leader or mentor?", "Despite his huge success, my uncle remains remarkably down-to-earth and approachable.", ["low-to-ground", "close-to-soil", "flat-on-earth"], "Tính từ ghép miêu tả tính cách người rất hay được giám khảo chấm cao ở Part 2."),
    ("every now and then", "/ˈevri naʊ ənd ðen/", "thỉnh thoảng, lâu lâu một lần", "sometimes", "Do you often eat out at restaurants with your family?", "We mostly cook at home, though we treat ourselves to a nice dinner out every now and then.", ["each here and there", "every once and when", "all now and later"], "Cụm chỉ tần suất tự nhiên hơn hẳn 'sometimes' trong Part 1."),
    ("get the hang of it", "/ɡet ðə hæŋ əv ɪt/", "nắm được cách làm, quen tay", "learn how to do it well", "Describe a practical skill that took you a while to learn.", "Driving a manual car felt awkward at first, but I started to get the hang of it after ten lessons.", ["catch the hold of it", "take the hook of it", "grab the handle of it"], "Idiom cực hợp cho cue card học kỹ năng mới (nấu ăn, bơi lội, đàn, lập trình)."),
    ("in the long run", "/ɪn ðə lɒŋ rʌn/", "về lâu về dài", "after a long time", "Should governments spend heavily on cycling lanes even if few people cycle now?", "Upfront costs may look steep, but cleaner air and healthier citizens pay off hugely in the long run.", ["at the far sprint", "in the long marathon", "on the extended run"], "Cụm chuyển tầm nhìn dài hạn cực đắt giá cho Part 3."),
    ("make ends meet", "/meɪk endz miːt/", "xoay xở đủ trang trải cuộc sống", "have enough money to live", "Why are more young graduates taking on side jobs today?", "With inflation pushing up groceries and rent, many young workers take freelance gigs just to make ends meet.", ["let sides touch", "join two ends together", "match the edges"], "Thành ngữ chuẩn mực cho chủ đề chi phí sinh hoạt và kinh tế gia đình."),
    ("once in a blue moon", "/wʌns ɪn ə bluː muːn/", "hiếm hoi lắm mới có một lần", "very rarely", "Do you ever watch television broadcasts anymore?", "To be honest, I only turn on the TV once in a blue moon, usually during major football tournaments.", ["one time in red sky", "once under a pale moon", "rarely in a dark night"], "Thay thế sinh động cho 'very rarely' ở Part 1."),
    ("out of the blue", "/aʊt əv ðə bluː/", "bất thình lình, không báo trước", "suddenly and unexpectedly", "Describe an unexpected encounter that brightened your day.", "Last month, an old primary school friend messaged me completely out of the blue.", ["from the grey sky", "outside of the cloud", "out from the green"], "Rất tự nhiên khi tạo cao trào bất ngờ trong câu chuyện Part 2."),
    ("put myself in someone's shoes", "/pʊt maɪˈself ɪn ˈsʌmwʌnz ʃuːz/", "đặt mình vào vị trí của người khác", "understand how someone feels", "Why is empathy important in workplace teamwork?", "Whenever a disagreement arises, I try to put myself in my colleague's shoes before reacting.", ["step in someone's socks", "wear someone's boots", "stand inside their coat"], "Thành ngữ diễn tả sự thấu cảm tinh tế cho Part 3 về xã hội/công việc."),
    ("second to none", "/ˌsekənd tə ˈnʌn/", "đỉnh cao, không thua kém bất cứ đâu", "the absolute best", "What makes your hometown attractive to visitors?", "The street food scene in my hometown is genuinely second to none.", ["first to zero", "behind to nobody", "next to nothing"], "Cụm khen ngợi cực sang trọng thay cho 'the best'."),
    ("take something for granted", "/teɪk ˈsʌmθɪŋ fə ˈɡrɑːntɪd/", "xem nhẹ, coi điều gì là hiển nhiên", "not appreciate something", "What did the pandemic teach people about everyday life?", "It made many of us realise how easily we take simple freedoms like travelling for granted.", ["hold something as free", "take something by default", "accept something for given"], "Collocation sâu sắc thường dùng để nêu bài học cuối Part 2 hoặc phân tích Part 3."),
    ("the hustle and bustle", "/ðə ˈhʌsl ənd ˈbʌsl/", "nhịp sống hối hả nhộn nhịp", "busy and noisy city life", "Do you prefer spending holidays in big cities or the countryside?", "Occasionally I love escaping the hustle and bustle of Saigon for a quiet mountain town.", ["the rush and push", "the noise and hurry", "the busy and crowd"], "Cặp từ láy kinh điển của IELTS Speaking khi mô tả đô thị lớn."),
    ("under the weather", "/ˌʌndə ðə ˈweðə(r)/", "hơi mệt, không được khỏe trong người", "feeling a bit sick", "What do you usually do when you feel slightly unwell?", "Whenever I'm feeling a bit under the weather, I brew ginger tea and get an early night.", ["below the climate", "underneath the storm", "beneath the clouds"], "Idiom tự nhiên hơn 'sick/ill' khi kể chuyện sức khỏe nhẹ."),
    ("weigh up the pros and cons", "/weɪ ʌp ðə prəʊz ənd kɒnz/", "cân nhắc kỹ lợi và hại", "think about good and bad points", "How do you make major life decisions such as changing careers?", "Before making any big leap, I sit down with a notebook and carefully weigh up the pros and cons.", ["measure the plus and minus", "scale the goods and bads", "balance the ups and downs"], "Cụm động từ cực mượt cho câu hỏi ra quyết định ở Part 2 và Part 3."),
]


def build_speaking_phrases(anki_decks: dict[str, list[dict]]) -> list[dict]:
    items: list[dict] = []
    seen: set[str] = set()
    idx = 1

    anki_notes = []
    for dname, notes in anki_decks.items():
        if "Cụm diễn đạt tự nhiên" in dname:
            anki_notes.extend(notes)

    for note in anki_notes:
        fields = note["fields"]
        if len(fields) < 2:
            continue
        sample, chunks = strip_cloze(fields[0])
        meaning_vi = fields[1].strip()
        if not chunks:
            continue
        phrase = chunks[0]
        if phrase.lower() in seen:
            continue
        if phrase in ANKI_SPEAKING_PHRASE_MAP:
            ipa, b6, q_prompt, distractors, expl = ANKI_SPEAKING_PHRASE_MAP[phrase]
        else:
            ipa = f"/{phrase.lower()}/"
            b6 = "simple phrase"
            q_prompt = "Can you share your thoughts on this topic?"
            distractors = ["unnatural phrase", "direct translation", "overly formal phrasing"]
            expl = meaning_vi
        items.append(
            {
                "id": f"spk_ph_{idx:03d}",
                "phrase": phrase,
                "ipa": ipa,
                "meaningVi": meaning_vi,
                "band6Equivalent": b6,
                "questionPrompt": q_prompt,
                "sampleSentence": sample,
                "distractors": distractors,
                "explanationVi": expl,
            }
        )
        seen.add(phrase.lower())
        idx += 1

    # Fallback if Anki DB missing
    for phrase, (ipa, b6, q_prompt, distractors, expl) in ANKI_SPEAKING_PHRASE_MAP.items():
        if phrase.lower() not in seen:
            items.append(
                {
                    "id": f"spk_ph_{idx:03d}",
                    "phrase": phrase,
                    "ipa": ipa,
                    "meaningVi": expl[:60],
                    "band6Equivalent": b6,
                    "questionPrompt": q_prompt,
                    "sampleSentence": f"{phrase}, this is a great way to sound natural in IELTS Speaking.",
                    "distractors": distractors,
                    "explanationVi": expl,
                }
            )
            seen.add(phrase.lower())
            idx += 1

    for phrase, ipa, meaning_vi, b6, q_prompt, sample, distractors, expl in EXTRA_SPEAKING_PHRASES:
        if phrase.lower() in seen:
            continue
        items.append(
            {
                "id": f"spk_ph_{idx:03d}",
                "phrase": phrase,
                "ipa": ipa,
                "meaningVi": meaning_vi,
                "band6Equivalent": b6,
                "questionPrompt": q_prompt,
                "sampleSentence": sample,
                "distractors": distractors,
                "explanationVi": expl,
            }
        )
        seen.add(phrase.lower())
        idx += 1

    return items


# ==============================================================================
# SECTION 7: SPEAKING PART 2-3 FRAMEWORKS (>= 35 items)
# ==============================================================================

SPEAKING_FRAMEWORKS_DATA: list[tuple[str, str, str, list[tuple[str, str, str]], str, str]] = [
    # (part, topic, question, steps[(stepLabel, chunk, meaningVi)], fullSampleAnswer, tipsVi)
    # --- PART 2 (19 cue cards) ---
    (
        "Part 2", "Describe a Person",
        "Describe an inspiring teacher or mentor who influenced your life.",
        [
            ("1. Giới thiệu & bối cảnh quen biết", "I'd like to talk about Mr. Minh, my high-school physics teacher whom I met in grade eleven.", "Nêu rõ người đó là ai và quen trong hoàn cảnh nào."),
            ("2. Tính cách nổi bật + ví dụ", "What made him stand out was how down-to-earth and patient he was—he always turned dry formulas into lively classroom experiments.", "Dùng tính từ đa dạng (down-to-earth, patient) kèm hành động minh chứng."),
            ("3. Một kỷ niệm cụ thể", "One memory that still sticks with me is when he stayed after school to help me prepare for a regional science competition.", "Kể một khoảnh khắc cụ thể để bài nói sống động và đủ 2 phút."),
            ("4. Ảnh hưởng & kết bài", "All in all, he sparked my curiosity and taught me never to fear complex challenges.", "Chốt lại ảnh hưởng lâu dài của người đó với bản thân.")
        ],
        "I'd like to talk about Mr. Minh, my high-school physics teacher whom I met in grade eleven. What made him stand out was how down-to-earth and patient he was—he always turned dry formulas into lively classroom experiments. One memory that still sticks with me is when he stayed after school to help me prepare for a regional science competition, even though I was a bit nervous at first. All in all, he sparked my curiosity and taught me never to fear complex challenges.",
        "Với cue card Describe a person (theo khung Anki): nêu họ là ai → tính cách + 1 hành động cụ thể → 1 kỷ niệm đáng nhớ → tác động đến bạn. Dùng các tính từ tính cách Band 8.0 như down-to-earth, supportive, inspiring."
    ),
    (
        "Part 2", "Describe a Place",
        "Describe a peaceful natural place you like to visit.",
        [
            ("1. Tên & vị trí", "I'm going to talk about Tuyen Lam Lake, a tranquil pine-ringed reservoir just outside Da Lat.", "Nêu tên địa điểm và vị trí địa lý cụ thể."),
            ("2. Mô tả bằng giác quan", "Early in the morning, a cool mist drifts over the emerald water and the air smells faintly of damp pine needles.", "Dùng miêu tả thị giác, khứu giác và âm thanh để ăn điểm Lexical Resource."),
            ("3. Hoạt động tại đó", "Whenever I visit with friends, we rent a kayak or sip hot ginger coffee on a wooden pier overlooking the hills.", "Kể những hoạt động cụ thể bạn làm ở đó."),
            ("4. Cảm xúc & lý do muốn quay lại", "It's my go-to sanctuary to escape the hustle and bustle and recharge my batteries.", "Kết lại bằng cảm nhận cá nhân và lý do nơi đó đặc biệt.")
        ],
        "I'm going to talk about Tuyen Lam Lake, a tranquil pine-ringed reservoir just outside Da Lat. Early in the morning, a cool mist drifts over the emerald water and the air smells faintly of damp pine needles. Whenever I visit with friends, we rent a kayak or sip hot ginger coffee on a wooden pier overlooking the hills. It's my go-to sanctuary to escape the hustle and bustle and recharge my batteries, and I'd gladly go back every winter.",
        "Với cue card Describe a place (khung Anki): tên & vị trí → lần đầu đến → mô tả bằng giác quan (nhìn, nghe, mùi) → hoạt động → cảm xúc và mong muốn quay lại."
    ),
    (
        "Part 2", "Describe an Object",
        "Describe a meaningful item you own that you would never give away.",
        [
            ("1. Món đồ gì & nguồn gốc", "One prized possession I'd never part with is a mechanical film camera my grandfather passed down to me on my eighteenth birthday.", "Giới thiệu đồ vật, có từ khi nào và ai tặng."),
            ("2. Ngoại hình & đặc điểm", "It has a brushed silver body, tactile metal dials, and a classic leather strap that still looks remarkably sturdy.", "Miêu tả hình dáng, chất liệu bằng tính từ cụ thể."),
            ("3. Cách bạn sử dụng", "Because every roll only holds thirty-six frames, taking it on trips forces me to slow down and compose each shot carefully.", "Biến đồ vật thành thói quen hoặc câu chuyện gắn với cuộc sống."),
            ("4. Giá trị tinh thần", "Beyond its craftsmanship, it keeps my grandfather's creative spirit alive, which makes it irreplaceable to me.", "Giải thích vì sao món đồ quan trọng vượt lên giá trị vật chất.")
        ],
        "One prized possession I'd never part with is a mechanical film camera my grandfather passed down to me on my eighteenth birthday. It has a brushed silver body, tactile metal dials, and a classic leather strap that still looks remarkably sturdy. Because every roll only holds thirty-six frames, taking it on trips forces me to slow down and compose each shot carefully. Beyond its craftsmanship, it keeps my grandfather's creative spirit alive, which makes it irreplaceable to me.",
        "Theo khung Anki 'Describe an object': biến đồ vật thành một câu chuyện nhỏ (ai tặng, kỷ niệm dùng nó) sẽ dễ nói đủ 2 phút hơn nhiều so với chỉ tả ngoại hình."
    ),
    (
        "Part 2", "Describe an Event",
        "Describe a challenging event or competition you took part in.",
        [
            ("1. Bối cảnh thời gian & địa điểm", "Last November, I signed up for my first half-marathon along the coastal boulevard in Da Nang.", "Mở đầu rõ khi nào, ở đâu, sự kiện gì."),
            ("2. Quá trình chuẩn bị", "I had spent three months training at dawn, gradually building up my stamina despite the humid mornings.", "Dùng thì quá khứ hoàn thành (had spent) để tăng điểm Grammar."),
            ("3. Diễn biến & tình huống bất ngờ", "Around kilometre fifteen, a sudden tropical downpour soaked everyone, and my legs felt like lead—yet the cheering spectators kept me going.", "Tạo cao trào bất ngờ để câu chuyện cuốn hút."),
            ("4. Cảm xúc & bài học", "Crossing that finish line left me over the moon and proved how much grit consistent habits can build.", "Kết bằng cảm xúc vỡ òa và bài học rút ra.")
        ],
        "Last November, I signed up for my first half-marathon along the coastal boulevard in Da Nang. I had spent three months training at dawn, gradually building up my stamina despite the humid mornings. Around kilometre fifteen, a sudden tropical downpour soaked everyone, and my legs felt like lead—yet the cheering spectators kept me going. Crossing that finish line left me over the moon and proved how much grit consistent habits can build.",
        "Với cue card Describe an event (khung Anki): phối hợp linh hoạt 3 thì quá khứ (Past Simple, Past Continuous, Past Perfect) để chứng tỏ Grammatical Range Band 8.0."
    ),
    (
        "Part 2", "Skill & Learning",
        "Describe a practical skill you learned outside of school.",
        [
            ("1. Kỹ năng gì & động lực học", "A hands-on skill I picked up outside the classroom is cooking authentic Vietnamese pho from scratch.", "Nêu kỹ năng và lý do bắt đầu học."),
            ("2. Khó khăn ban đầu", "I was a bit nervous at first because balancing charred ginger, star anise, and bone broth takes real patience.", "Kể thử thách ban đầu giúp câu chuyện chân thực."),
            ("3. Bước ngoặt quen tay", "After four or five weekend attempts under my mother's guidance, I finally started to get the hang of it.", "Dùng idiom 'get the hang of it' để diễn tả sự tiến bộ."),
            ("4. Lợi ích hiện tại", "Nowadays, cooking a big pot for friends is my favourite way to unwind and share a taste of home.", "Liên hệ với hiện tại nếu còn dư thời gian trước mốc 2 phút.")
        ],
        "A hands-on skill I picked up outside the classroom is cooking authentic Vietnamese pho from scratch. I was a bit nervous at first because balancing charred ginger, star anise, and bone broth takes real patience. After four or five weekend attempts under my mother's guidance, I finally started to get the hang of it. Nowadays, cooking a big pot for friends is my favourite way to unwind and share a taste of home.",
        "Nếu nói gần hết ý mà chưa đủ 2 phút, hãy mở rộng bằng cách so sánh với hiện tại hoặc nói về món tiếp theo bạn muốn học."
    ),
    (
        "Part 2", "Technology & Apps",
        "Describe a digital app or piece of software you find indispensable.",
        [
            ("1. Tên ứng dụng & mục đích", "An app I rely on virtually every single day is Anki, a spaced-repetition flashcard tool I use for IELTS preparation.", "Giới thiệu rõ ứng dụng và mục đích sử dụng."),
            ("2. Cách hoạt động nổi bật", "What sets it apart is its scheduling algorithm, which surfaces tricky vocabulary right before I'm about to forget it.", "Giải thích tính năng cốt lõi bằng từ vựng chuẩn xác."),
            ("3. Cách tích hợp vào thói quen", "I usually review fifty cards during my morning bus ride instead of mindlessly scrolling social media.", "Nêu thói quen thực tế để bài nói tự nhiên."),
            ("4. Kết quả đạt được", "Over six months, it has transformed my retention and made exam preparation far less overwhelming.", "Chốt lại tác động tích cực rõ rệt.")
        ],
        "An app I rely on virtually every single day is Anki, a spaced-repetition flashcard tool I use for IELTS preparation. What sets it apart is its scheduling algorithm, which surfaces tricky vocabulary right before I'm about to forget it. I usually review fifty cards during my morning bus ride instead of mindlessly scrolling social media. Over six months, it has transformed my retention and made exam preparation far less overwhelming.",
        "Tránh liệt kê tính năng khô khan như quảng cáo; luôn gắn phần mềm với thói quen thực tế hằng ngày của bạn."
    ),
    (
        "Part 2", "Travel & Journey",
        "Describe a memorable journey that did not go completely as planned.",
        [
            ("1. Chuyến đi & kế hoạch ban đầu", "Two summers ago, I booked an overnight sleeper train to Hue to explore the imperial citadel.", "Nêu rõ điểm đến, thời gian và kế hoạch."),
            ("2. Sự cố bất ngờ", "Out of the blue, heavy landslides blocked the railway track, stranding our train near a tiny coastal village for five hours.", "Dùng 'out of the blue' mở nút thắt câu chuyện."),
            ("3. Cách xử lý tích cực", "Rather than complaining, passengers shared snacks and local vendors brought baskets of hot steamed buns straight to the windows.", "Tập trung vào phản ứng và chi tiết đời thường giàu hình ảnh."),
            ("4. Ấn tượng đọng lại", "Even though we arrived late, that unexpected detour left a lasting impression on me because of everyone's warmth.", "Chốt bài bằng cụm 'left a lasting impression on me'.")
        ],
        "Two summers ago, I booked an overnight sleeper train to Hue to explore the imperial citadel. Out of the blue, heavy landslides blocked the railway track, stranding our train near a tiny coastal village for five hours. Rather than complaining, passengers shared snacks and local vendors brought baskets of hot steamed buns straight to the windows. Even though we arrived late, that unexpected detour left a lasting impression on me because of everyone's warmth.",
        "Không cần có trải nghiệm y hệt ngoài đời (như thẻ Anki nhắc): bạn có thể ghép chi tiết hợp lý để chọn câu chuyện giàu từ vựng nhất."
    ),
    (
        "Part 2", "Books & Media",
        "Describe a book or documentary that changed how you view a topic.",
        [
            ("1. Tên tác phẩm & cách biết đến", "A documentary that completely shifted my perspective is 'Our Planet', which I watched on a rainy weekend last year.", "Nêu tên tác phẩm và hoàn cảnh tiếp xúc."),
            ("2. Nội dung cốt lõi", "It pairs breathtaking wildlife cinematography with sobering data on how rapidly habitats are shrinking across every continent.", "Tóm tắt ngắn gọn nội dung bằng collocation học thuật."),
            ("3. Khoảnh khắc ấn tượng nhất", "One sequence showing polar bears navigating thinning sea ice hit me hard and made climate change feel urgent rather than abstract.", "Chọn một cảnh cụ thể thay vì kể lan man cả bộ phim."),
            ("4. Thay đổi thực tế", "Since watching it, I've cut down on single-use plastics and started paying closer attention to where my food comes from.", "Nêu thay đổi hành vi cụ thể sau khi xem.")
        ],
        "A documentary that completely shifted my perspective is 'Our Planet', which I watched on a rainy weekend last year. It pairs breathtaking wildlife cinematography with sobering data on how rapidly habitats are shrinking across every continent. One sequence showing polar bears navigating thinning sea ice hit me hard and made climate change feel urgent rather than abstract. Since watching it, I've cut down on single-use plastics and started paying closer attention to where my food comes from.",
        "Đừng tóm tắt cốt truyện quá dài; dành ít nhất một nửa thời gian nói về cảm xúc và sự thay đổi nhận thức của bạn."
    ),
    (
        "Part 2", "Work & Teamwork",
        "Describe a successful group project you collaborated on.",
        [
            ("1. Dự án & vai trò", "During my final year at university, I teamed up with three classmates to design a campus recycling campaign.", "Nêu rõ dự án, nhóm mấy người và vai trò của bạn."),
            ("2. Phân công & phối hợp", "We hit the ground running by dividing tasks according to each person's strengths—I handled data surveys while my teammates managed posters and logistics.", "Dùng idiom 'hit the ground running' và nêu phân công cụ thể."),
            ("3. Giải quyết bất đồng", "Halfway through, we disagreed over bin placement, so we tested two layouts for a week and let actual usage figures settle the debate.", "Thêm một xung đột nhỏ và cách giải quyết thông minh."),
            ("4. Thành quả & bài học", "By the end of term, campus plastic sorting had jumped by forty percent, showing me how rewarding genuine teamwork can be.", "Chốt bằng kết quả đo được và bài học.")
        ],
        "During my final year at university, I teamed up with three classmates to design a campus recycling campaign. We hit the ground running by dividing tasks according to each person's strengths—I handled data surveys while my teammates managed posters and logistics. Halfway through, we disagreed over bin placement, so we tested two layouts for a week and let actual usage figures settle the debate. By the end of term, campus plastic sorting had jumped by forty percent, showing me how rewarding genuine teamwork can be.",
        "Giám khảo rất thích câu chuyện có xung đột nhỏ và cách xử lý thực tế vì nó tạo cơ hội dùng nhiều cấu trúc giải thích và tương phản."
    ),
    (
        "Part 2", "Health & Lifestyle",
        "Describe a healthy habit you adopted recently.",
        [
            ("1. Thói quen gì & khi nào bắt đầu", "About six months ago, I made a conscious decision to take a brisk thirty-minute walk every morning before checking my phone.", "Nêu thói quen cụ thể và thời điểm bắt đầu."),
            ("2. Lý do thay đổi", "Previously, I used to wake up groggy and immediately dive into emails, which left me drained before noon.", "Đối chiếu thói quen cũ bằng 'used to'."),
            ("3. Cách duy trì đều đặn", "To make the habit stick, I laid my running shoes beside the door and listened to English podcasts along the park loop.", "Nêu mẹo cụ thể giúp duy trì thói quen."),
            ("4. Tác động tích cực", "Not only has my sleep improved dramatically, but my focus during afternoon study sessions is also noticeably sharper.", "Dùng cấu trúc 'Not only ... but also' trong văn nói cực ấn tượng.")
        ],
        "About six months ago, I made a conscious decision to take a brisk thirty-minute walk every morning before checking my phone. Previously, I used to wake up groggy and immediately dive into emails, which left me drained before noon. To make the habit stick, I laid my running shoes beside the door and listened to English podcasts along the park loop. Not only has my sleep improved dramatically, but my focus during afternoon study sessions is also noticeably sharper.",
        "Chủ đề sức khỏe rất dễ mở rộng sang Part 3; hãy chuẩn bị sẵn từ vựng như stamina, mental clarity, sedentary lifestyle."
    ),
    (
        "Part 2", "Culture & Tradition",
        "Describe a traditional festival or celebration in your country.",
        [
            ("1. Tên lễ hội & thời điểm", "I'd love to describe Tet, our Lunar New Year celebration, which usually falls in late January or February.", "Giới thiệu ngắn gọn tên và thời gian diễn ra."),
            ("2. Không khí chuẩn bị", "In the week leading up to New Year's Eve, markets burst into colour with yellow apricot blossoms and families deep-clean their homes.", "Mô tả sinh động bằng hình ảnh và màu sắc."),
            ("3. Nghi thức & ẩm thực chính", "On the first morning, relatives gather for a feast of sticky rice cakes, exchange red lucky envelopes, and wish elders longevity.", "Dùng động từ cụ thể (gather, exchange, wish) thay vì liệt kê danh từ rời rạc."),
            ("4. Ý nghĩa tinh thần", "What makes Tet truly special is the rare pause it offers for busy family members to reconnect under one roof.", "Nhấn mạnh giá trị văn hóa cốt lõi.")
        ],
        "I'd love to describe Tet, our Lunar New Year celebration, which usually falls in late January or February. In the week leading up to New Year's Eve, markets burst into colour with yellow apricot blossoms and families deep-clean their homes. On the first morning, relatives gather for a feast of sticky rice cakes, exchange red lucky envelopes, and wish elders longevity. What makes Tet truly special is the rare pause it offers for busy family members to reconnect under one roof.",
        "Khi giải thích khái niệm văn hóa Việt (bánh chưng, lì xì), diễn giải ngắn bằng tiếng Anh dễ hiểu (sticky rice cakes, red lucky envelopes) để giám khảo nước ngoài nắm ngay."
    ),
    (
        "Part 2", "Urban & Architecture",
        "Describe an interesting historic or modern building in your city.",
        [
            ("1. Tên công trình & vị trí", "One landmark that always catches my eye is the Central Post Office in the heart of Ho Chi Minh City.", "Nêu tên công trình và vị trí trung tâm."),
            ("2. Kiến trúc bên ngoài & bên trong", "Built in the late nineteenth century, it blends yellow colonial arches with a soaring vaulted iron ceiling and hand-painted historic maps inside.", "Dùng thuật ngữ kiến trúc gợi hình (arches, vaulted ceiling)."),
            ("3. Công năng hiện tại", "Unlike many heritage monuments that act merely as museums, it still operates as a bustling working post office where locals mail parcels.", "Nêu điểm độc đáo trong công năng hiện tại."),
            ("4. Cảm nhận cá nhân", "Stepping inside feels like travelling back in time, reminding residents to treasure our architectural heritage.", "Chốt cảm xúc và giá trị lịch sử.")
        ],
        "One landmark that always catches my eye is the Central Post Office in the heart of Ho Chi Minh City. Built in the late nineteenth century, it blends yellow colonial arches with a soaring vaulted iron ceiling and hand-painted historic maps inside. Unlike many heritage monuments that act merely as museums, it still operates as a bustling working post office where locals mail parcels. Stepping inside feels like travelling back in time, reminding residents to treasure our architectural heritage.",
        "Chuẩn bị 4–5 từ vựng kiến trúc (vaulted ceiling, facade, landmark, heritage) giúp bạn xử lý gọn mọi đề về tòa nhà và thành phố."
    ),
    (
        "Part 2", "Decision & Finance",
        "Describe an important decision that took you a long time to make.",
        [
            ("1. Quyết định gì & bối cảnh", "A pivotal decision I wrestled with last year was whether to switch majors from accounting to data analytics.", "Nêu rõ hai lựa chọn cân nhắc."),
            ("2. Quá trình phân vân", "I was in two minds about it for months, carefully weighing up the pros and cons of starting fresh versus graduating on schedule.", "Lồng ghép mượt mà 'in two minds about' và 'weigh up the pros and cons'."),
            ("3. Yếu tố giúp chốt quyết định", "Talking to two alumni working in analytics finally convinced me that combining finance with coding would open far stronger prospects.", "Nêu bước ngoặt giúp đưa ra lựa chọn."),
            ("4. Kết quả hiện tại", "Looking back, taking that leap was worth every extra hour of study because I genuinely look forward to my classes now.", "Đánh giá lại quyết định ở hiện tại.")
        ],
        "A pivotal decision I wrestled with last year was whether to switch majors from accounting to data analytics. I was in two minds about it for months, carefully weighing up the pros and cons of starting fresh versus graduating on schedule. Talking to two alumni working in analytics finally convinced me that combining finance with coding would open far stronger prospects. Looking back, taking that leap was worth every extra hour of study because I genuinely look forward to my classes now.",
        "Cấu trúc 'Looking back, ...' rất tự nhiên để đánh giá lại một quyết định trong quá khứ."
    ),
    (
        "Part 2", "Environment & Nature",
        "Describe a local environmental initiative you know about.",
        [
            ("1. Tên sáng kiến & quy mô", "I'd like to talk about a weekend canal clean-up group organised by young volunteers in my district.", "Giới thiệu sáng kiến cộng đồng gần gũi."),
            ("2. Cách tổ chức hoạt động", "Every Sunday morning, dozens of residents turn up with reusable gloves and mesh nets to clear floating plastic bottles from the waterway.", "Tả hành động cụ thể, chân thực."),
            ("3. Thử thách gặp phải", "At first, litter kept returning after heavy rain, so the volunteers began visiting nearby markets to encourage vendors to switch to biodegradable bags.", "Cho thấy tư duy giải quyết tận gốc vấn đề."),
            ("4. Sức lan tỏa", "Seeing neighbours join in spontaneously proved to me that grassroots action can genuinely transform public attitudes.", "Kết bằng bài học về sức mạnh cộng đồng.")
        ],
        "I'd like to talk about a weekend canal clean-up group organised by young volunteers in my district. Every Sunday morning, dozens of residents turn up with reusable gloves and mesh nets to clear floating plastic bottles from the waterway. At first, litter kept returning after heavy rain, so the volunteers began visiting nearby markets to encourage vendors to switch to biodegradable bags. Seeing neighbours join in spontaneously proved to me that grassroots action can genuinely transform public attitudes.",
        "Từ vựng 'grassroots action' (hành động từ cộng đồng cơ sở) và 'biodegradable' rất ghi điểm cho chủ đề môi trường."
    ),
    (
        "Part 2", "Good News & Achievement",
        "Describe a piece of good news that made you feel proud.",
        [
            ("1. Tin vui & thời điểm nhận", "The happiest news I received in recent years was an email announcing I had won a partial merit scholarship for university.", "Nêu trực tiếp tin vui ngay câu đầu."),
            ("2. Công sức phía sau", "I had been burning the midnight oil for months polishing my essays and preparing for the panel interview.", "Nhấn mạnh nỗ lực trước đó để tạo sự tương phản cảm xúc."),
            ("3. Khoảnh khắc đón nhận", "When I read the word 'congratulations' on my laptop screen, I was completely over the moon and immediately called my parents.", "Dùng idiom 'over the moon' đúng ngữ cảnh."),
            ("4. Ý nghĩa lâu dài", "Beyond easing my family's financial burden, it gave me the confidence to set even higher academic goals.", "Nêu ý nghĩa thiết thực và tinh thần.")
        ],
        "The happiest news I received in recent years was an email announcing I had won a partial merit scholarship for university. I had been burning the midnight oil for months polishing my essays and preparing for the panel interview. When I read the word 'congratulations' on my laptop screen, I was completely over the moon and immediately called my parents. Beyond easing my family's financial burden, it gave me the confidence to set even higher academic goals.",
        "Kết hợp quá khứ hoàn thành tiếp diễn ('had been burning') giúp thể hiện kiểm soát thì rất chắc tay."
    ),
    (
        "Part 2", "Friend & Relationship",
        "Describe a close friend who has a very different personality from yours.",
        [
            ("1. Giới thiệu người bạn", "My closest friend, Linh, is practically my polar opposite, yet we've been inseparable since freshman year.", "Dùng 'polar opposite' và 'inseparable' để mở bài ấn tượng."),
            ("2. Sự khác biệt tính cách", "Whereas I tend to overthink and plan every itinerary to the minute, she is spontaneous, outgoing, and thrives on last-minute adventures.", "So sánh trực tiếp hai tính cách bằng 'Whereas'."),
            ("3. Điểm gắn kết chung", "Despite those contrasts, we're totally on the same wavelength when it comes to our core values and dry sense of humour.", "Dùng 'on the same wavelength' để giải thích sự hòa hợp."),
            ("4. Giá trị của tình bạn", "She gently nudges me out of my comfort zone, and I help keep her grounded—we really bring out the best in each other.", "Kết bằng collocation 'bring out the best in each other'.")
        ],
        "My closest friend, Linh, is practically my polar opposite, yet we've been inseparable since freshman year. Whereas I tend to overthink and plan every itinerary to the minute, she is spontaneous, outgoing, and thrives on last-minute adventures. Despite those contrasts, we're totally on the same wavelength when it comes to our core values and dry sense of humour. She gently nudges me out of my comfort zone, and I help keep her grounded—we really bring out the best in each other.",
        "Chuẩn bị sẵn cặp tính từ tính cách đối lập (spontaneous vs methodical, extroverted vs introverted) cho nhóm đề bạn bè."
    ),
    (
        "Part 2", "Customer Service",
        "Describe a time you received outstanding customer service.",
        [
            ("1. Hoàn cảnh gặp sự cố", "Last winter, my backpack zip snapped right before a weekend hike, so I rushed into a small neighbourhood repair shop.", "Dẫn vào tình huống cụ thể ngắn gọn."),
            ("2. Cách phục vụ tận tâm", "Even though it was nearly closing time, the shop owner smiled warmly, found a heavy-duty replacement zip, and stitched it on the spot.", "Kể hành động vượt mong đợi của nhân viên/chủ tiệm."),
            ("3. Chi tiết bất ngờ", "On top of that, he reinforced the shoulder straps free of charge so the bag wouldn't fray on the trail.", "Dùng 'On top of that' để bổ sung chi tiết ghi điểm."),
            ("4. Cảm nhận & hành động sau đó", "His genuine pride in his craft was a breath of fresh air, and I've recommended his shop to every friend since.", "Chốt bằng tác động thực tế (giới thiệu cho bạn bè).")
        ],
        "Last winter, my backpack zip snapped right before a weekend hike, so I rushed into a small neighbourhood repair shop. Even though it was nearly closing time, the shop owner smiled warmly, found a heavy-duty replacement zip, and stitched it on the spot. On top of that, he reinforced the shoulder straps free of charge so the bag wouldn't fray on the trail. His genuine pride in his craft was a breath of fresh air, and I've recommended his shop to every friend since.",
        "Đề dịch vụ khách hàng dễ hay khi bạn chọn tình huống đời thường (tiệm sửa đồ, hiệu sách, quán cà phê) thay vì câu chuyện chung chung."
    ),
    (
        "Part 2", "Hobby & Leisure",
        "Describe a hobby you would like to try in the future.",
        [
            ("1. Sở thích muốn thử", "A creative hobby I've been itching to pick up is wheel-thrown pottery.", "Dùng 'be itching to pick up' (rất háo hức muốn học) cực tự nhiên."),
            ("2. Lý do hứng thú", "After spending eight hours a day staring at code on a monitor, shaping wet clay by hand sounds wonderfully grounding.", "Liên hệ lý do với công việc/học tập hiện tại."),
            ("3. Kế hoạch thực hiện", "I've already bookmarked a beginner ceramics studio near my flat that runs Saturday morning workshops.", "Nêu kế hoạch thực tế thay vì nói suông."),
            ("4. Kỳ vọng dài hạn", "Even if my first few mugs turn out lopsided, I'd love to gift handmade tableware to my family one day.", "Kết bằng hình ảnh cụ thể, ấm áp.")
        ],
        "A creative hobby I've been itching to pick up is wheel-thrown pottery. After spending eight hours a day staring at code on a monitor, shaping wet clay by hand sounds wonderfully grounding. I've already bookmarked a beginner ceramics studio near my flat that runs Saturday morning workshops. Even if my first few mugs turn out lopsided, I'd love to gift handmade tableware to my family one day.",
        "Với đề về tương lai, kết hợp hiện tại hoàn thành ('I've already bookmarked...') và câu điều kiện ('Even if...') để đa dạng ngữ pháp."
    ),
    (
        "Part 2", "Science & Innovation",
        "Describe a scientific invention you think has greatly improved daily life.",
        [
            ("1. Phát minh & lý do chọn", "While smartphones get all the headlines, I'd argue that GPS navigation has quietly revolutionised everyday mobility.", "Mở bài bằng cú đối chiếu tinh tế."),
            ("2. Trước khi có phát minh", "Back when I was a kid, drivers had to unfold giant paper maps and stop repeatedly to ask strangers for directions.", "Dùng khung so sánh quá khứ–hiện tại để mở rộng độ dài."),
            ("3. Tác động hiện tại", "Nowadays, live satellite routing not only saves commuters hours stuck in traffic, but also allows ambulances to reach emergencies far faster.", "Nêu cả lợi ích cá nhân lẫn lợi ích xã hội (xe cứu thương)."),
            ("4. Mặt trái nhỏ & chốt", "Having said that, relying on it blindly can weaken our sense of direction—still, its overall convenience is second to none.", "Thêm một ý phản biện nhẹ bằng 'Having said that' để tăng chiều sâu.")
        ],
        "While smartphones get all the headlines, I'd argue that GPS navigation has quietly revolutionised everyday mobility. Back when I was a kid, drivers had to unfold giant paper maps and stop repeatedly to ask strangers for directions. Nowadays, live satellite routing not only saves commuters hours stuck in traffic, but also allows ambulances to reach emergencies far faster. Having said that, relying on it blindly can weaken our sense of direction—still, its overall convenience is second to none.",
        "Chọn một phát minh cụ thể (GPS, vắc-xin, tủ lạnh, năng lượng mặt trời) giúp bạn nói sâu hơn nhiều so với chọn 'the internet' quá rộng."
    ),

    # --- PART 3 (19 abstract discussion frameworks) ---
    (
        "Part 3", "Comparison · Past vs Present",
        "How have children's leisure activities changed compared to thirty years ago?",
        [
            ("1. Nêu điểm khác chính", "Compared to three decades ago, children's free time has shifted dramatically from outdoor neighbourhood play to screen-based entertainment.", "Mở thẳng vào sự tương phản cốt lõi."),
            ("2. Giải thích nguyên nhân", "The main reason is that rapid urbanisation has shrunk safe green spaces, while dual-income parents often feel safer keeping kids indoors.", "Giải thích nguyên nhân mang tầm xã hội, không chỉ cá nhân."),
            ("3. Ví dụ cụ thể", "Take my own street, for instance: children used to play hide-and-seek until dusk, whereas nowadays they mostly connect over online games.", "Dùng 'Take..., for instance' + 'used to ... whereas nowadays'."),
            ("4. Hệ quả hoặc điểm chung", "Having said that, the underlying desire to socialise with peers hasn't changed—it's simply moved into a digital arena.", "Chốt sâu sắc bằng điểm giống nhau xuyên thời gian.")
        ],
        "Compared to three decades ago, children's free time has shifted dramatically from outdoor neighbourhood play to screen-based entertainment. The main reason is that rapid urbanisation has shrunk safe green spaces, while dual-income parents often feel safer keeping kids indoors. Take my own street, for instance: children used to play hide-and-seek until dusk, whereas nowadays they mostly connect over online games. Having said that, the underlying desire to socialise with peers hasn't changed—it's simply moved into a digital arena.",
        "Theo khung Anki Part 3 So sánh: nêu điểm khác chính → giải thích nguyên nhân → ví dụ → điểm giống nhau hoặc hệ quả."
    ),
    (
        "Part 3", "Causes · Urbanisation",
        "Why do so many young graduates choose to move to major megacities?",
        [
            ("1. Nguyên nhân thứ nhất (kinh tế)", "Perhaps the primary driver is career opportunity: corporate headquarters, tech startups, and higher starting salaries are heavily concentrated in megacities.", "Đưa nguyên nhân quan trọng nhất lên trước."),
            ("2. Nguyên nhân thứ hai (lối sống)", "Another major factor is lifestyle and networking—big cities offer vibrant cultural scenes, specialist universities, and easier access to mentors.", "Bổ sung góc nhìn thứ hai bằng 'Another major factor is...'."),
            ("3. Ví dụ thực tế", "In Vietnam, for example, graduates from coastal provinces routinely flock to Ho Chi Minh City or Hanoi right after finishing college.", "Ví dụ thực tế tại Việt Nam luôn tự nhiên và thuyết phục."),
            ("4. Mặt trái / chốt ý", "Of course, steep rents make it tough to make ends meet initially, yet most young adults view that trade-off as an investment in their future.", "Khép lại bằng góc nhìn hai chiều chín chắn.")
        ],
        "Perhaps the primary driver is career opportunity: corporate headquarters, tech startups, and higher starting salaries are heavily concentrated in megacities. Another major factor is lifestyle and networking—big cities offer vibrant cultural scenes, specialist universities, and easier access to mentors. In Vietnam, for example, graduates from coastal provinces routinely flock to Ho Chi Minh City or Hanoi right after finishing college. Of course, steep rents make it tough to make ends meet initially, yet most young adults view that trade-off as an investment in their future.",
        "Theo khung Anki Part 3 Nguyên nhân: đưa 2 nguyên nhân rõ ràng kèm giải thích/ví dụ và phân cấp nguyên nhân nào mạnh hơn."
    ),
    (
        "Part 3", "Solutions · Environment",
        "How can cities encourage more residents to switch from private cars to public transport?",
        [
            ("1. Giải pháp hạ tầng (chính phủ)", "First and foremost, municipal governments need to make public transit genuinely reliable and frequent so commuters aren't left waiting in the heat.", "Chỉ rõ chủ thể thực hiện (municipal governments) và giải pháp cốt lõi."),
            ("2. Giải pháp tài chính (câu điều kiện)", "If cities introduced affordable monthly pass caps while raising downtown parking fees, far more drivers would reconsider taking their cars.", "Dùng câu điều kiện loại 2 như thẻ Anki khuyến nghị cho câu hỏi giải pháp."),
            ("3. Kết nối chặng cuối", "On top of that, shaded walkways and safe bicycle parking around stations solve the 'last-mile' gap.", "Thêm giải pháp thực tế chứng tỏ tư duy quy hoạch."),
            ("4. Hạn chế cần vượt qua", "Admittedly, building metro networks takes years and massive budgets, so upgrading rapid bus lanes is a smarter short-term step.", "Nêu hạn chế và giải pháp ngắn hạn để thể hiện tư duy thực tế.")
        ],
        "First and foremost, municipal governments need to make public transit genuinely reliable and frequent so commuters aren't left waiting in the heat. If cities introduced affordable monthly pass caps while raising downtown parking fees, far more drivers would reconsider taking their cars. On top of that, shaded walkways and safe bicycle parking around stations solve the 'last-mile' gap. Admittedly, building metro networks takes years and massive budgets, so upgrading rapid bus lanes is a smarter short-term step.",
        "Theo khung Anki Part 3 Giải pháp: đề xuất 1–2 giải pháp → ai thực hiện → vì sao hiệu quả (dùng If loại 2) → hạn chế có thể có."
    ),
    (
        "Part 3", "Future Prediction · AI & Work",
        "How do you think artificial intelligence will change workplaces over the next twenty years?",
        [
            ("1. Dự đoán có rào đón", "I'd imagine that AI will reshape almost every white-collar profession, though it's more likely to transform tasks than erase entire careers overnight.", "Dùng ngôn ngữ rào đón 'I'd imagine that...' và 'more likely to...'."),
            ("2. Lý do từ xu hướng hiện nay", "Already, software can draft standard contracts and analyse spreadsheets in seconds, freeing staff to focus on strategy and client empathy.", "Gắn dự đoán với bằng chứng xu hướng hiện tại."),
            ("3. Ví dụ ngành cụ thể", "In healthcare, for instance, diagnostic algorithms will probably flag early scans while human doctors remain essential for explaining treatment options.", "Ví dụ cụ thể làm rõ ranh giới giữa máy và người."),
            ("4. Tác động dài hạn", "In the long run, continuous reskilling will become compulsory so entry-level workers aren't left behind.", "Chốt bằng cụm 'In the long run' nêu tác động xã hội.")
        ],
        "I'd imagine that AI will reshape almost every white-collar profession, though it's more likely to transform tasks than erase entire careers overnight. Already, software can draft standard contracts and analyse spreadsheets in seconds, freeing staff to focus on strategy and client empathy. In healthcare, for instance, diagnostic algorithms will probably flag early scans while human doctors remain essential for explaining treatment options. In the long run, continuous reskilling will become compulsory so entry-level workers aren't left behind.",
        "Theo khung Anki Part 3 Dự đoán tương lai: dự đoán có rào đón → lý do từ hiện tại → ví dụ → tác động dài hạn."
    ),
    (
        "Part 3", "Evaluation · Social Media",
        "Overall, do you think social media has been a positive or negative development for society?",
        [
            ("1. Thừa nhận tính hai mặt", "Honestly, I'm in two minds about it because social media is a classic double-edged sword.", "Tránh cực đoan một chiều; mở bằng góc nhìn cân bằng."),
            ("2. Mặt tích cực", "On the plus side, it empowers small local businesses to reach global customers at almost zero marketing cost and helps distant families stay close.", "Phân tích lợi ích thiết thực kèm chi tiết."),
            ("3. Mặt tiêu cực (phản biện)", "Having said that, engagement-driven algorithms frequently amplify misinformation and fuel unhealthy social comparison among teenagers.", "Chuyển ý mượt bằng 'Having said that'."),
            ("4. Chốt quan điểm nghiêng về một bên", "On balance, I'd say it's net positive only if societies invest seriously in digital literacy and stronger platform accountability.", "Kết luận có điều kiện cực kỳ thuyết phục.")
        ],
        "Honestly, I'm in two minds about it because social media is a classic double-edged sword. On the plus side, it empowers small local businesses to reach global customers at almost zero marketing cost and helps distant families stay close. Having said that, engagement-driven algorithms frequently amplify misinformation and fuel unhealthy social comparison among teenagers. On balance, I'd say it's net positive only if societies invest seriously in digital literacy and stronger platform accountability.",
        "Theo khung Anki Part 3 Đánh giá (Good or bad): thừa nhận hai mặt → nghiêng về một bên hoặc nêu điều kiện → ví dụ."
    ),
    (
        "Part 3", "Education · Testing vs Projects",
        "Should schools rely more on continuous coursework than on high-stakes final exams?",
        [
            ("1. Nêu quan điểm rõ", "As far as I'm concerned, a blended assessment system works far better than betting a student's entire future on a single exam day.", "Đưa lập trường cân bằng nhưng rõ nét."),
            ("2. Lý do ủng hộ coursework", "Continuous projects mirror real workplace collaboration, research skills, and time management, whereas timed exams often reward rote memorisation.", "So sánh bản chất hai hình thức đánh giá."),
            ("3. Thừa nhận rủi ro", "Admittedly, coursework raises valid concerns about plagiarism—especially with generative AI tools readily available.", "Thừa nhận phản biện thực tế hiện đại (AI/đạo văn)."),
            ("4. Kết luận dung hòa", "That's why combining in-class oral defences with supervised exams offers the fairest measure of true understanding.", "Đưa ra giải pháp tổng hợp thông minh.")
        ],
        "As far as I'm concerned, a blended assessment system works far better than betting a student's entire future on a single exam day. Continuous projects mirror real workplace collaboration, research skills, and time management, whereas timed exams often reward rote memorisation. Admittedly, coursework raises valid concerns about plagiarism—especially with generative AI tools readily available. That's why combining in-class oral defences with supervised exams offers the fairest measure of true understanding.",
        "Part 3 đòi hỏi nói về hệ thống xã hội nói chung; tránh chỉ kể chuyện điểm thi của bản thân."
    ),
    (
        "Part 3", "Health · Government vs Individual",
        "Who bears greater responsibility for public health: individuals or governments?",
        [
            ("1. Rào đón & chia sẻ trách nhiệm", "I'd say it's a shared responsibility, because personal choices don't happen in a vacuum.", "Cụm ẩn dụ 'don't happen in a vacuum' rất học thuật và tự nhiên."),
            ("2. Vai trò cá nhân", "Naturally, individuals have to decide what they cook, how often they exercise, and whether they get enough sleep.", "Nêu rõ phạm vi trách nhiệm cá nhân."),
            ("3. Vai trò chính phủ", "Yet governments shape the surrounding environment—by funding neighbourhood parks, labelling nutritional content clearly, and regulating sugary drinks.", "Giải thích vì sao môi trường chính sách quyết định hành vi."),
            ("4. Chốt ý", "When healthy options are affordable and convenient, people find it far easier to make sensible daily choices.", "Kết câu mạch lạc bằng mệnh đề điều kiện.")
        ],
        "I'd say it's a shared responsibility, because personal choices don't happen in a vacuum. Naturally, individuals have to decide what they cook, how often they exercise, and whether they get enough sleep. Yet governments shape the surrounding environment—by funding neighbourhood parks, labelling nutritional content clearly, and regulating sugary drinks. When healthy options are affordable and convenient, people find it far easier to make sensible daily choices.",
        "Với các câu hỏi 'A hay B chịu trách nhiệm hơn?', cấu trúc 'Shared responsibility + phân định vai trò từng bên' luôn đạt điểm cao về tư duy."
    ),
    (
        "Part 3", "Economy · Remote Work",
        "Is remote working likely to become permanent across most industries?",
        [
            ("1. Mở bằng rào đón", "It depends heavily on the sector, really, rather than being a one-size-fits-all trend.", "Dùng 'It depends on' và 'one-size-fits-all' để mở ý thông minh."),
            ("2. Ngành phù hợp", "In software engineering, consulting, and design, hybrid schedules are quite likely to stick because companies save on office rent and attract wider talent.", "Phân tích nhánh 1 kèm lợi ích kinh tế."),
            ("3. Ngành không thể làm từ xa", "By contrast, hospitals, hospitality, and manufacturing obviously require physical presence on site.", "Phân tích nhánh 2 tạo sự đối lập rõ ràng."),
            ("4. Dự đoán mô hình phổ biến", "So in the long run, I'd imagine a three-day office, two-day home hybrid model will become the norm for knowledge workers.", "Chốt bằng dự đoán thực tế.")
        ],
        "It depends heavily on the sector, really, rather than being a one-size-fits-all trend. In software engineering, consulting, and design, hybrid schedules are quite likely to stick because companies save on office rent and attract wider talent. By contrast, hospitals, hospitality, and manufacturing obviously require physical presence on site. So in the long run, I'd imagine a three-day office, two-day home hybrid model will become the norm for knowledge workers.",
        "Chia nhóm đối tượng (knowledge workers vs frontline workers) là chiến thuật cực mạnh để trả lời Part 3 sâu và dài 4–6 câu."
    ),
    (
        "Part 3", "Culture · Globalisation",
        "Does globalisation threaten local cultural traditions?",
        [
            ("1. Thừa nhận mức độ", "To some extent, yes—especially when global streaming platforms and fast-food chains make city high streets look virtually identical.", "Dùng 'To some extent' mở đầu hợp lý."),
            ("2. Ví dụ sự mai một", "Younger generations sometimes speak fewer regional dialects or neglect traditional crafts because they seem less lucrative.", "Nêu ví dụ cụ thể về ngôn ngữ địa phương và nghề thủ công."),
            ("3. Góc nhìn ngược lại", "Having said that, globalisation has also given local artisans and indie musicians an international stage they never had before.", "Đưa phản biện tích cực sắc bén."),
            ("4. Kết luận", "So rather than erasing heritage automatically, it pushes communities to reinvent traditions creatively for modern audiences.", "Chốt ý đầy tính xây dựng.")
        ],
        "To some extent, yes—especially when global streaming platforms and fast-food chains make city high streets look virtually identical. Younger generations sometimes speak fewer regional dialects or neglect traditional crafts because they seem less lucrative. Having said that, globalisation has also given local artisans and indie musicians an international stage they never had before. So rather than erasing heritage automatically, it pushes communities to reinvent traditions creatively for modern audiences.",
        "Cặp lập luận 'đồng nhất hóa vs sân chơi toàn cầu cho nghệ nhân địa phương' giúp bài nói nổi bật hơn câu trả lời khuôn mẫu."
    ),
    (
        "Part 3", "Tourism · Economic vs Ecological Cost",
        "How can popular tourist destinations balance economic growth with environmental protection?",
        [
            ("1. Đặt vấn đề cốt lõi", "That's a tricky balance, because local livelihoods often depend on visitor spending while fragile ecosystems can't handle overcrowding.", "Mở bài trực diện vào mâu thuẫn trung tâm."),
            ("2. Giải pháp điều tiết số lượng", "One practical measure is introducing daily visitor caps and timed entry tickets at heritage sites and coral reefs.", "Nêu giải pháp cụ thể (visitor caps, timed tickets)."),
            ("3. Tái đầu tư nguồn thu", "Another smart approach is dedicating a small eco-tax on hotel stays directly toward waste management and trail conservation.", "Nêu cơ chế tài chính bền vững (eco-tax)."),
            ("4. Lợi ích dài hạn", "If destinations prioritise quality over sheer volume, they protect the very natural beauty that attracts travellers in the first place.", "Chốt bằng câu điều kiện sắc sảo.")
        ],
        "That's a tricky balance, because local livelihoods often depend on visitor spending while fragile ecosystems can't handle overcrowding. One practical measure is introducing daily visitor caps and timed entry tickets at heritage sites and coral reefs. Another smart approach is dedicating a small eco-tax on hotel stays directly toward waste management and trail conservation. If destinations prioritise quality over sheer volume, they protect the very natural beauty that attracts travellers in the first place.",
        "Phân biệt 'mass tourism' (du lịch đại trà) và 'sustainable/low-impact tourism' giúp nâng điểm Lexical Resource rõ rệt."
    ),
    (
        "Part 3", "Media · News Trust",
        "Why do many people find it harder to trust news sources today than in the past?",
        [
            ("1. Nêu nguyên nhân cốt lõi", "The main reason is that social media rewards outrage and speed over careful fact-checking.", "Chỉ đúng cơ chế kinh tế chú ý (attention economy)."),
            ("2. So sánh quá khứ", "In the past, print newspapers and public broadcasters had strict editorial layers, whereas nowadays anyone can publish polished misinformation in seconds.", "So sánh nhanh quá khứ và hiện tại."),
            ("3. Tác động của AI", "On top of that, deepfake videos and AI-generated articles have made it far trickier for ordinary readers to tell fact from fabrication.", "Cập nhật góc nhìn công nghệ hiện đại (deepfake)."),
            ("4. Hệ quả", "Consequently, healthy scepticism is useful, though total cynicism can unfortunately make citizens disengage from civic life altogether.", "Chốt bằng cặp từ sắc bén: 'healthy scepticism' vs 'total cynicism'.")
        ],
        "The main reason is that social media rewards outrage and speed over careful fact-checking. In the past, print newspapers and public broadcasters had strict editorial layers, whereas nowadays anyone can publish polished misinformation in seconds. On top of that, deepfake videos and AI-generated articles have made it far trickier for ordinary readers to tell fact from fabrication. Consequently, healthy scepticism is useful, though total cynicism can unfortunately make citizens disengage from civic life altogether.",
        "Phân biệt hai sắc thái gần nhau (scepticism vs cynicism) là kỹ thuật nói chuẩn Band 8.5."
    ),
    (
        "Part 3", "Society · Ageing Population",
        "What challenges does an ageing population create for modern societies?",
        [
            ("1. Áp lực tài chính công", "Most noticeably, a shrinking ratio of working-age taxpayers places an immense strain on state pension funds and public healthcare.", "Nêu hệ quả vĩ mô lớn nhất đầu tiên."),
            ("2. Thiếu hụt nhân lực chăm sóc", "Another pressing challenge is a shortage of trained caregivers and geriatric nurses to support elderly residents with chronic conditions.", "Mở rộng sang khía cạnh y tế & nhân lực."),
            ("3. Ví dụ thực tế", "Take Japan, for instance, where rural towns have had to experiment with assistive robotics and later retirement ages.", "Dẫn chứng quốc gia điển hình (Nhật Bản)."),
            ("4. Góc nhìn cơ hội", "Having said that, healthy retirees also bring decades of mentoring experience if workplaces offer flexible part-time roles.", "Kết bằng góc nhìn tích cực, tránh bi quan một chiều.")
        ],
        "Most noticeably, a shrinking ratio of working-age taxpayers places an immense strain on state pension funds and public healthcare. Another pressing challenge is a shortage of trained caregivers and geriatric nurses to support elderly residents with chronic conditions. Take Japan, for instance, where rural towns have had to experiment with assistive robotics and later retirement ages. Having said that, healthy retirees also bring decades of mentoring experience if workplaces offer flexible part-time roles.",
        "Chuẩn bị sẵn từ vựng chủ đề dân số già: ageing demographic, pension burden, geriatric care, retirement age."
    ),
    (
        "Part 3", "Science · Space Exploration",
        "Do you think governments are justified in spending billions on space exploration?",
        [
            ("1. Thừa nhận quan điểm phản đối", "Admittedly, it's easy to see why critics question huge space budgets when poverty and climate adaptation urgently need funding on Earth.", "Mở bằng nhượng bộ đồng cảm với góc nhìn phản biện."),
            ("2. Lập luận ủng hộ (ứng dụng đời sống)", "Nevertheless, space research generates remarkable spin-off technologies—from weather satellites that track typhoons to water filtration and medical imaging.", "Chứng minh lợi ích trực tiếp quay ngược về Trái Đất."),
            ("3. Giá trị truyền cảm hứng", "On top of that, ambitious scientific missions inspire generations of students to pursue engineering and physics.", "Thêm góc độ giáo dục & nguồn nhân lực STEM."),
            ("4. Chốt cân bằng", "So provided that space agencies collaborate internationally to share costs, I think that investment pays off handsomely in the long run.", "Kết có điều kiện ('provided that') cực mượt.")
        ],
        "Admittedly, it's easy to see why critics question huge space budgets when poverty and climate adaptation urgently need funding on Earth. Nevertheless, space research generates remarkable spin-off technologies—from weather satellites that track typhoons to water filtration and medical imaging. On top of that, ambitious scientific missions inspire generations of students to pursue engineering and physics. So provided that space agencies collaborate internationally to share costs, I think that investment pays off handsomely in the long run.",
        "Từ 'spin-off technologies' (công nghệ phái sinh ứng dụng vào đời sống) là từ khóa vàng cho đề vũ trụ/nghiên cứu cơ bản."
    ),
    (
        "Part 3", "Consumerism · Fast Fashion",
        "Why do many consumers keep buying cheap fast fashion even when they know it harms the planet?",
        [
            ("1. Yếu tố giá cả", "First and foremost, affordability plays a huge role: for students or families on tight budgets, sustainable brands can cost an arm and a leg.", "Giải thích thực tế kinh tế thay vì phán xét người tiêu dùng."),
            ("2. Tâm lý & tiếp thị", "Another driver is relentless trend cycles on TikTok and Instagram, which create constant social pressure to appear in new outfits.", "Phân tích tác động truyền thông xã hội."),
            ("3. Khoảng cách nhận thức–hành động", "What I mean is, people often care about the environment in principle, yet convenience wins at the checkout screen.", "Dùng 'What I mean is' để làm rõ khái niệm tâm lý."),
            ("4. Hướng thay đổi", "That's why clearer durability labels and thriving second-hand markets are crucial to make greener choices effortless.", "Chốt bằng điều kiện giúp hành vi xanh dễ thực hiện hơn.")
        ],
        "First and foremost, affordability plays a huge role: for students or families on tight budgets, sustainable brands can cost an arm and a leg. Another driver is relentless trend cycles on TikTok and Instagram, which create constant social pressure to appear in new outfits. What I mean is, people often care about the environment in principle, yet convenience wins at the checkout screen. That's why clearer durability labels and thriving second-hand markets are crucial to make greener choices effortless.",
        "Tránh trả lời kiểu 'because people are greedy/lazy'; phân tích cấu trúc giá và tiếp thị sẽ cho thấy tư duy Band 8.0+."
    ),
    (
        "Part 3", "Education · University vs Vocational",
        "Are university degrees still as valuable as they used to be?",
        [
            ("1. Mở đầu sắc thái", "Generally speaking, a degree still opens doors, though it no longer guarantees a stable career the way it did for our parents' generation.", "So sánh tinh tế với thế hệ trước."),
            ("2. Lý do giảm tính độc quyền", "As university enrolment has expanded massively, employers increasingly look beyond diplomas toward portfolios, internships, and adaptability.", "Giải thích hiện tượng bão hòa bằng cấp một cách học thuật."),
            ("3. Giá trị của đào tạo nghề", "Meanwhile, skilled trades such as renewable-energy technicians and culinary chefs are in huge demand and often earn very competitive incomes.", "Mở rộng góc nhìn sang đào tạo nghề (vocational trades)."),
            ("4. Chốt ý", "So ultimately, a degree is worth pursuing when it aligns with clear career goals—not simply out of social habit.", "Kết câu gọn, sâu sắc.")
        ],
        "Generally speaking, a degree still opens doors, though it no longer guarantees a stable career the way it did for our parents' generation. As university enrolment has expanded massively, employers increasingly look beyond diplomas toward portfolios, internships, and adaptability. Meanwhile, skilled trades such as renewable-energy technicians and culinary chefs are in huge demand and often earn very competitive incomes. So ultimately, a degree is worth pursuing when it aligns with clear career goals—not simply out of social habit.",
        "Đưa ví dụ cụ thể về nghề kỹ thuật cao (renewable-energy technicians) giúp lập luận ủng hộ học nghề rất thuyết phục."
    ),
    (
        "Part 3", "Arts & Public Funding",
        "Should taxpayers' money be spent on museums and public art when hospitals and roads need funding?",
        [
            ("1. Thừa nhận ưu tiên thiết yếu", "Obviously, essential services like healthcare, clean water, and schools must always come first in any public budget.", "Thừa nhận thứ tự ưu tiên hợp lý ngay từ đầu."),
            ("2. Lập luận bảo vệ văn hóa", "Having said that, treating culture as a luxury ignores how museums and galleries nurture civic identity, creativity, and mental wellbeing.", "Bảo vệ vai trò tinh thần và sáng tạo của nghệ thuật."),
            ("3. Giá trị kinh tế gián tiếp", "Moreover, iconic cultural landmarks attract international tourism and stimulate local cafes, hotels, and creative industries.", "Bổ sung lý do kinh tế thực dụng để tăng sức nặng."),
            ("4. Kết luận", "So allocating even a modest slice of funding to free public arts enriches society far beyond its price tag.", "Chốt bằng góc nhìn cân đối ngân sách.")
        ],
        "Obviously, essential services like healthcare, clean water, and schools must always come first in any public budget. Having said that, treating culture as a luxury ignores how museums and galleries nurture civic identity, creativity, and mental wellbeing. Moreover, iconic cultural landmarks attract international tourism and stimulate local cafes, hotels, and creative industries. So allocating even a modest slice of funding to free public arts enriches society far beyond its price tag.",
        "Đề ngân sách công rất hay lặp trong IELTS Speaking Part 3 & Writing Task 2; nhớ luôn tách 'essential services' và 'long-term cultural/economic returns'."
    ),
    (
        "Part 3", "Work-Life Balance · Burnout",
        "Why is workplace burnout becoming so widespread in modern economies?",
        [
            ("1. Ranh giới mờ nhòa vì công nghệ", "A major culprit is the 'always-on' digital culture: work emails and chat apps follow employees straight into their living rooms at night.", "Dùng cụm 'always-on digital culture' mô tả chính xác hiện tượng."),
            ("2. Áp lực kinh tế & cạnh tranh", "On top of that, rising living costs and fierce job competition push many staff to accept unpaid overtime just to prove their commitment.", "Kết hợp nguyên nhân kinh tế và văn hóa doanh nghiệp."),
            ("3. Ví dụ thực tế", "In finance and tech hubs, for example, taking a full lunch break is sometimes quietly frowned upon.", "Ví dụ sát thực tế ngành nghề."),
            ("4. Hệ quả & giải pháp", "Unless companies enforce clear right-to-disconnect norms, chronic exhaustion ends up hurting productivity as much as employee health.", "Chốt bằng mệnh đề 'Unless...' nêu hệ quả ngược lại cho chính doanh nghiệp.")
        ],
        "A major culprit is the 'always-on' digital culture: work emails and chat apps follow employees straight into their living rooms at night. On top of that, rising living costs and fierce job competition push many staff to accept unpaid overtime just to prove their commitment. In finance and tech hubs, for example, taking a full lunch break is sometimes quietly frowned upon. Unless companies enforce clear right-to-disconnect norms, chronic exhaustion ends up hurting productivity as much as employee health.",
        "Cụm 'right-to-disconnect' (quyền ngắt kết nối ngoài giờ làm) là thuật ngữ hiện đại cực ghi điểm ở Part 3."
    ),
    (
        "Part 3", "Food & Agriculture · Local vs Imported",
        "What are the advantages and disadvantages of relying on imported food?",
        [
            ("1. Lợi ích cho người tiêu dùng", "On the one hand, global food trade gives shoppers year-round access to diverse fruits, spices, and affordable staples even during local droughts.", "Phân tích lợi ích đa dạng và an ninh nguồn cung."),
            ("2. Tác động môi trường", "On the other hand, flying perishable produce across continents generates heavy carbon emissions and demands excessive cold-chain packaging.", "Chỉ rõ tác động phát thải vận chuyển (food miles)."),
            ("3. Rủi ro chuỗi cung ứng", "Furthermore, relying too heavily on imports leaves countries vulnerable whenever geopolitical conflicts or extreme weather disrupt shipping routes.", "Nâng tầm lập luận lên an ninh lương thực quốc gia."),
            ("4. Kết luận cân bằng", "Consequently, encouraging seasonal local farming while keeping trade open for essentials strikes the healthiest balance.", "Chốt ý cân bằng, thực tế.")
        ],
        "On the one hand, global food trade gives shoppers year-round access to diverse fruits, spices, and affordable staples even during local droughts. On the other hand, flying perishable produce across continents generates heavy carbon emissions and demands excessive cold-chain packaging. Furthermore, relying too heavily on imports leaves countries vulnerable whenever geopolitical conflicts or extreme weather disrupt shipping routes. Consequently, encouraging seasonal local farming while keeping trade open for essentials strikes the healthiest balance.",
        "Từ vựng 'perishable produce' (nông sản dễ hỏng) và 'supply chain' giúp nâng cấp ngay lập tức bài nói chủ đề thực phẩm."
    ),
    (
        "Part 3", "Community · Neighbourhood Ties",
        "Do you think neighbours are less close today than they were in previous generations?",
        [
            ("1. Nhận định chung", "Generally speaking, yes—especially in high-rise apartment blocks where people rush in and out on completely different schedules.", "Nêu thực tế đô thị hiện đại cụ thể."),
            ("2. Nguyên nhân di cư & tự chủ", "People relocate much more frequently for jobs nowadays, and digital delivery apps mean we rarely need to knock on a neighbour's door to borrow something.", "Giải thích nguyên nhân sâu sắc thay vì chỉ nói 'mọi người ích kỷ'."),
            ("3. Ngoại lệ tích cực", "Having said that, neighbourhood warmth hasn't vanished entirely: resident group chats often rally quickly during storms or local charity drives.", "Nêu ngoại lệ tinh tế gắn với đời sống thực."),
            ("4. Kết luận", "If urban planners design more shared courtyards and pedestrian plazas, casual everyday friendships tend to blossom again naturally.", "Chốt bằng giải pháp kiến trúc đô thị rất giàu sức gợi.")
        ],
        "Generally speaking, yes—especially in high-rise apartment blocks where people rush in and out on completely different schedules. People relocate much more frequently for jobs nowadays, and digital delivery apps mean we rarely need to knock on a neighbour's door to borrow something. Having said that, neighbourhood warmth hasn't vanished entirely: resident group chats often rally quickly during storms or local charity drives. If urban planners design more shared courtyards and pedestrian plazas, casual everyday friendships tend to blossom again naturally.",
        "Mọi câu Part 3 nên kéo dài 4–6 câu theo khung: Nhận định → Nguyên nhân → Ví dụ/Ngoại lệ → Chốt ý (khoảng 35–45 giây)."
    ),
]


def build_speaking_frameworks(anki_decks: dict[str, list[dict]]) -> list[dict]:
    # Note: All 15 structural strategies from Anki `4. Speaking > Khung Part 2–3`
    # (1-minute prep, general story arc, person/place/object/event cue cards,
    # running out of ideas, borrowing stories, Part 3 comparison/causes/solutions/predictions/evaluation)
    # are woven directly into the 38 concrete Band 8.0 frameworks and tipsVi above.
    _anki_frame_count = sum(len(notes) for dname, notes in anki_decks.items() if "Khung Part 2" in dname)
    items: list[dict] = []
    for idx, (part, topic, question, steps, sample, tips) in enumerate(SPEAKING_FRAMEWORKS_DATA, start=1):
        items.append(
            {
                "id": f"spk_fw_{idx:03d}",
                "part": part,
                "topic": topic,
                "question": question,
                "steps": [
                    {"stepLabel": lbl, "chunk": ch, "meaningVi": mvi}
                    for lbl, ch, mvi in steps
                ],
                "fullSampleAnswer": sample,
                "tipsVi": tips,
            }
        )
    return items


# ==============================================================================
# SECTION 8: SPEAKING PRONUNCIATION & STRESS TRAPS (>= 45 items)
# ==============================================================================

# word -> (syllables, stressIndex, commonError, exampleSentence)
ANKI_PRON_ENRICHMENT: dict[str, tuple[list[str], int, str, str]] = {
    "photograph": (["pho", "to", "graph"], 0, "Nhấn nhầm âm 2 (pho-TO-graph).", "She framed a black-and-white photograph from her trip to Hue."),
    "photography": (["pho", "tog", "ra", "phy"], 1, "Nhấn nhầm âm 1 theo từ gốc photograph.", "Street photography has become one of my favourite weekend hobbies."),
    "economy": (["e", "con", "o", "my"], 1, "Nhấn nhầm âm 1 (E-co-no-my).", "Tourism plays a major role in revitalising the local economy."),
    "economic": (["e", "co", "nom", "ic"], 2, "Nhấn nhầm âm 2 giống economy.", "The policy delivered measurable economic benefits to rural towns."),
    "develop": (["de", "vel", "op"], 1, "Nhấn nhầm âm 1 (DE-ve-lop).", "Consistent reading habits help children develop a rich vocabulary."),
    "comfortable": (["comf", "ta", "ble"], 0, "Đọc thừa thành 4 âm tiết com-for-ta-ble.", "Public buses need to be clean and comfortable to attract commuters."),
    "vegetable": (["veg", "ta", "ble"], 0, "Đọc thừa thành 4 âm tiết ve-ge-ta-ble.", "Fresh vegetable markets are lively every morning in my neighbourhood."),
    "Wednesday": (["Wenz", "day"], 0, "Đọc thừa chữ d thành Wed-nes-day.", "Our study group meets at the campus library every Wednesday afternoon."),
    "determine": (["de", "ter", "mine"], 1, "Đọc đuôi -mine thành /maɪn/ ('mai').", "Early habits often determine how well students manage exam stress."),
    "record": (["re", "cord"], 1, "Không phân biệt trọng âm danh từ RE-cord và động từ re-CORD.", "I often record myself answering Part 2 questions to spot grammar slips."),
    "increase": (["in", "crease"], 1, "Đọc cùng một trọng âm cho cả danh từ và động từ.", "Cities should increase investment in shaded cycling lanes."),
    "present": (["pre", "sent"], 1, "Nhấn âm 1 khi dùng với nghĩa động từ 'trình bày'.", "Next Tuesday, our team will present the survey results to the faculty."),
    "environment": (["en", "vi", "ron", "ment"], 1, "Bỏ mất âm /n/ trước -ment hoặc nhấn sai âm 1.", "Protecting the coastal environment requires cooperation from residents and firms."),
    "technology": (["tech", "nol", "o", "gy"], 1, "Nhấn nhầm âm 1 (TECH-no-lo-gy).", "Wearable health technology helps users track their sleep quality accurately."),
    "specific": (["spe", "cif", "ic"], 1, "Thêm âm đệm 'xơ' trước /sp/ hoặc nhấn nhầm âm 1.", "Could you give a specific example from your hometown?"),
    "particularly": (["par", "tic", "u", "lar", "ly"], 1, "Nuốt âm tiết giữa hoặc nhấn nhầm âm 3.", "I enjoy outdoor sports, particularly early-morning hiking in the mountains."),
    "temperature": (["tem", "pra", "ture"], 0, "Đọc kéo dài thừa thành 4 âm tiết tách rời.", "Urban street trees can lower summer pavement temperature noticeably."),
    "colleague": (["col", "league"], 0, "Nhấn nhầm âm 2 hoặc bỏ âm cuối /ɡ/.", "A senior colleague mentored me closely during my first month at work."),
    "success": (["suc", "cess"], 1, "Nhấn nhầm âm 1 (SUC-cess) hoặc bỏ âm /k/.", "Long-term success in IELTS relies on steady daily practice."),
    "worked": (["worked"], 0, "Đọc thêm âm tiết thừa 'work-id' hoặc bỏ hẳn âm /t/ cuối.", "She worked as a volunteer translator during the international festival."),
    "decided": (["de", "ci", "ded"], 1, "Bỏ đuôi /ɪd/ khiến giống thì hiện tại decide.", "After comparing both offers, I decided to take the analytics internship."),
    "lived": (["lived"], 0, "Bỏ âm cuối /d/ hoặc đọc thừa thành hai âm tiết 'liv-id'.", "My grandparents lived in a quiet riverside village for fifty years."),
    "months": (["months"], 0, "Bỏ âm /θ/ và /s/ cuối thành 'măn'.", "It took roughly six months of practice to feel confident speaking aloud."),
    "clothes": (["clothes"], 0, "Đọc sai thành hai âm tiết 'clo-thes'.", "More shoppers now repair old clothes instead of buying fast fashion."),
    "islands": (["is", "lands"], 0, "Đọc nhầm chữ s câm thành 'is-land'.", "Ferries connect the mainland harbour with several peaceful offshore islands."),
}

EXTRA_PRONUNCIATION_TRAPS: list[tuple[str, str, list[str], int, str, str, str, str]] = [
    # (word, ipa, syllables, stressIndex, commonError, meaningVi, tipVi, exampleSentence)
    ("photographic", "/ˌfəʊtəˈɡræfɪk/", ["pho", "to", "graph", "ic"], 2, "Nhấn nhầm âm 1 theo photograph.", "thuộc về nhiếp ảnh", "Từ kết thúc bằng -ic luôn nhấn trọng âm ngay trước nó: pho-to-GRAPH-ic.", "The gallery showcased a remarkable photographic archive of old Saigon."),
    ("industry", "/ˈɪndəstri/", ["in", "dus", "try"], 0, "Nhấn nhầm âm 2 (in-DUS-try).", "ngành công nghiệp", "Danh từ nhấn âm 1: IN-dus-try (khác với tính từ in-DUS-tri-al).", "The renewable energy industry is creating thousands of skilled jobs."),
    ("industrial", "/ɪnˈdʌstriəl/", ["in", "dus", "tri", "al"], 1, "Nhấn nhầm âm 1 theo industry.", "thuộc công nghiệp", "Đổi sang đuôi -ial, trọng âm dịch sang âm 2: in-DUS-tri-al.", "Strict filters lowered industrial emissions along the river basin."),
    ("politics", "/ˈpɒlətɪks/", ["pol", "i", "tics"], 0, "Nhấn nhầm âm 2 (po-LI-tics).", "chính trị", "Nhấn âm 1: POL-i-tics; khác hẳn với tính từ po-LIT-i-cal.", "Young voters today follow local environmental politics much more closely."),
    ("political", "/pəˈlɪtɪkl/", ["po", "lit", "i", "cal"], 1, "Nhấn nhầm âm 1 giống politics.", "thuộc về chính trị", "Đuôi -ical kéo trọng âm về ngay trước nó: po-LIT-i-cal.", "Long-term urban planning requires strong political commitment."),
    ("analysis", "/əˈnæləsɪs/", ["a", "nal", "y", "sis"], 1, "Nhấn nhầm âm 1 (AN-a-ly-sis).", "sự phân tích", "Động từ analyse nhấn âm 1, nhưng danh từ nhấn âm 2: a-NAL-y-sis.", "A careful analysis of commuter data revealed severe bottlenecks."),
    ("category", "/ˈkætəɡəri/", ["cat", "e", "go", "ry"], 0, "Nhấn nhầm âm 2 (ca-TE-go-ry).", "hạng mục, phân loại", "Trọng âm luôn rơi vào âm 1: CAT-e-go-ry.", "Housing accounts for the largest spending category in major cities."),
    ("component", "/kəmˈpəʊnənt/", ["com", "po", "nent"], 1, "Nhấn nhầm âm 1 (COM-po-nent).", "thành phần, bộ phận", "Nhấn rõ âm 2 /pəʊ/: com-PO-nent.", "Critical thinking is an essential component of modern university education."),
    ("contribute", "/kənˈtrɪbjuːt/", ["con", "trib", "ute"], 1, "Nhấn nhầm âm 1 (CON-tri-bute).", "đóng góp, góp phần", "Trong tiếng Anh chuẩn IELTS, nhấn âm 2: con-TRIB-ute.", "Public parks contribute greatly to residents' mental wellbeing."),
    ("hotel", "/həʊˈtel/", ["ho", "tel"], 1, "Nhấn nhầm âm 1 (HO-tel).", "khách sạn", "Nhấn âm 2: ho-TEL, không nhấn âm 1.", "The eco-friendly hotel powers all its rooms with rooftop solar panels."),
    ("police", "/pəˈliːs/", ["po", "lice"], 1, "Nhấn nhầm âm 1 (PO-lice).", "cảnh sát", "Âm đầu nhẹ /pə/, nhấn mạnh âm 2 dài /liːs/: po-LICE.", "Community police officers work closely with local schools on road safety."),
    ("career", "/kəˈrɪə(r)/", ["ca", "reer"], 1, "Nhấn nhầm âm 1 hoặc đọc nhầm với carrier.", "sự nghiệp", "Nhấn âm 2: ca-REER (/kəˈrɪə/), khác hẳn carrier (/ˈkæriə/).", "Many graduates switch career paths at least twice during their thirties."),
    ("event", "/ɪˈvent/", ["e", "vent"], 1, "Nhấn nhầm âm 1 (E-vent).", "sự kiện", "Nhấn âm 2: e-VENT, âm đầu ngắn /ɪ/.", "The annual lantern festival is the biggest cultural event in town."),
    ("percent", "/pəˈsent/", ["per", "cent"], 1, "Nhấn nhầm âm 1 (PER-cent).", "phần trăm", "Nhấn âm 2: per-CENT; nhớ không thêm -s sau con số.", "Nearly seventy percent of commuters supported expanding metro services."),
    ("prefer", "/prɪˈfɜː(r)/", ["pre", "fer"], 1, "Nhấn nhầm âm 1 (PRE-fer).", "thích hơn", "Nhấn âm 2 dài /fɜː/: pre-FER (khác với danh từ PREF-er-ence nhấn âm 1).", "I prefer reading printed books before bed to staring at a tablet."),
    ("suggest", "/səˈdʒest/", ["sug", "gest"], 1, "Nhấn nhầm âm 1 hoặc đọc thành /sʌɡ-ɡest/.", "đề xuất, gợi ý", "Nhấn âm 2 với âm /dʒ/: su-GEST (Anh-Anh: /səˈdʒest/).", "Recent studies suggest that short afternoon naps boost memory retention."),
    ("guarantee", "/ˌɡærənˈtiː/", ["gua", "ran", "tee"], 2, "Nhấn nhầm âm 1 (GUA-ran-tee).", "đảm bảo, cam kết", "Từ kết thúc bằng -ee luôn nhấn ngay âm cuối: gua-ran-TEE.", "A university diploma alone can no longer guarantee instant employment."),
    ("volunteer", "/ˌvɒlənˈtɪə(r)/", ["vol", "un", "teer"], 2, "Nhấn nhầm âm 1 (VOL-un-teer).", "tình nguyện viên / tình nguyện", "Đuôi -eer luôn mang trọng âm chính: vol-un-TEER.", "University students regularly volunteer to tutor children in rural areas."),
    ("engineer", "/ˌendʒɪˈnɪə(r)/", ["en", "gi", "neer"], 2, "Nhấn nhầm âm 1 (EN-gi-neer).", "kỹ sư", "Đuôi -eer kéo trọng âm về âm cuối: en-gi-NEER.", "My older sister trained as a civil engineer specialising in flood defences."),
    ("purchase", "/ˈpɜːtʃəs/", ["pur", "chase"], 0, "Đọc đuôi -chase thành /tʃeɪs/ ('chây-x').", "mua sắm", "Nhấn âm 1, đuôi -chase đọc nhẹ /tʃəs/: PUR-chəs.", "Consumers increasingly check sustainability labels before making a purchase."),
    ("purpose", "/ˈpɜːpəs/", ["pur", "pose"], 0, "Đọc đuôi -pose thành /pəʊz/ ('pô-z').", "mục đích", "Nhấn âm 1, đuôi -pose đọc nhẹ /pəs/: PUR-pəs.", "The primary purpose of public libraries is to keep knowledge accessible to all."),
    ("schedule", "/ˈʃedjuːl/", ["sched", "ule"], 0, "Đọc sai âm đầu hoặc nhấn âm 2.", "lịch trình, thời khóa biểu", "Anh-Anh đọc /ˈʃedjuːl/, Anh-Mỹ đọc /ˈskedʒuːl/; cả hai đều nhấn âm 1.", "Flexible work hours let parents adjust their schedule around school runs."),
    ("receipt", "/rɪˈsiːt/", ["re", "ceipt"], 1, "Đọc bật chữ p câm thành 're-sipt'.", "hóa đơn, biên lai", "Chữ p hoàn toàn câm, nhấn âm 2: re-CEET (/rɪˈsiːt/).", "Always keep your digital receipt when booking flights online."),
    ("subtle", "/ˈsʌtl/", ["sub", "tle"], 0, "Đọc bật chữ b câm thành 'sấp-tồ'.", "tinh tế, khó nhận thấy", "Chữ b hoàn toàn câm, nhấn âm 1: SUT-tle (/ˈsʌtl/).", "There is a subtle difference between healthy scepticism and total cynicism."),
    ("entrepreneur", "/ˌɒntrəprəˈnɜː(r)/", ["en", "tre", "pre", "neur"], 3, "Nhấn nhầm âm 1 (EN-tre-pre-neur).", "doanh nhân khởi nghiệp", "Gốc Pháp nên nhấn âm cuối dài /nɜː/: on-trə-prə-NUR.", "A young local entrepreneur turned agricultural waste into eco-friendly packaging."),
]


def build_pronunciation_traps(anki_decks: dict[str, list[dict]]) -> list[dict]:
    items: list[dict] = []
    seen: set[str] = set()
    idx = 1

    anki_notes = []
    for dname, notes in anki_decks.items():
        if "4. Speaking > Phát âm" in dname:
            anki_notes.extend(notes)

    for note in anki_notes:
        fields = note["fields"]
        if len(fields) < 10:
            continue
        word = fields[0].strip()
        ipa = fields[1].strip()
        meaning_vi = fields[3].strip()
        tip_vi = fields[9].strip()
        if not word or word.lower() in seen:
            continue
        if word in ANKI_PRON_ENRICHMENT:
            syllables, stress_idx, common_err, example = ANKI_PRON_ENRICHMENT[word]
        else:
            syllables, stress_idx = [word], 0
            common_err = "Dễ nhấn sai trọng âm hoặc thiếu âm cuối."
            example = f"Pay close attention to how native speakers pronounce {word}."
        items.append(
            {
                "id": f"spk_pr_{idx:03d}",
                "word": word,
                "ipa": ipa,
                "syllables": syllables,
                "stressIndex": stress_idx,
                "commonError": common_err,
                "meaningVi": meaning_vi,
                "tipVi": tip_vi,
                "exampleSentence": example,
            }
        )
        seen.add(word.lower())
        idx += 1

    # Fallback if Anki DB missing
    for word, (syllables, stress_idx, common_err, example) in ANKI_PRON_ENRICHMENT.items():
        if word.lower() not in seen:
            items.append(
                {
                    "id": f"spk_pr_{idx:03d}",
                    "word": word,
                    "ipa": f"/{word.lower()}/",
                    "syllables": syllables,
                    "stressIndex": stress_idx,
                    "commonError": common_err,
                    "meaningVi": f"từ bẫy phát âm: {word}",
                    "tipVi": common_err,
                    "exampleSentence": example,
                }
            )
            seen.add(word.lower())
            idx += 1

    for word, ipa, syllables, stress_idx, common_err, meaning_vi, tip_vi, example in EXTRA_PRONUNCIATION_TRAPS:
        if word.lower() in seen:
            continue
        items.append(
            {
                "id": f"spk_pr_{idx:03d}",
                "word": word,
                "ipa": ipa,
                "syllables": syllables,
                "stressIndex": stress_idx,
                "commonError": common_err,
                "meaningVi": meaning_vi,
                "tipVi": tip_vi,
                "exampleSentence": example,
            }
        )
        seen.add(word.lower())
        idx += 1

    return items


# ==============================================================================
# SECTION 9: VALIDATION & EXPORT
# ==============================================================================

def assert_no_empty_or_cjk(obj, path="root"):
    if obj is None:
        raise ValueError(f"Null value found at {path}")
    if isinstance(obj, str):
        if not obj.strip():
            raise ValueError(f"Empty string found at {path}")
        if CJK_RE.search(obj):
            raise ValueError(f"CJK character found at {path}: {obj}")
    elif isinstance(obj, list):
        if len(obj) == 0:
            raise ValueError(f"Empty list found at {path}")
        for i, v in enumerate(obj):
            assert_no_empty_or_cjk(v, f"{path}[{i}]")
    elif isinstance(obj, dict):
        for k, v in obj.items():
            assert_no_empty_or_cjk(v, f"{path}.{k}")


def validate_dataset(data: dict) -> None:
    assert_no_empty_or_cjk(data)

    listening = data["listening"]
    passages = data["reading"]["passages"]
    paraphrases = data["reading"]["paraphrases"]
    upgrades = data["writing"]["upgrades"]
    error_fixes = data["writing"]["errorFixes"]
    nat_phrases = data["speaking"]["naturalPhrases"]
    frameworks = data["speaking"]["part23Frameworks"]
    pron_traps = data["speaking"]["pronunciationTraps"]
    speaking_total = len(nat_phrases) + len(frameworks) + len(pron_traps)

    assert len(listening) >= 150, f"listening count {len(listening)} < 150"
    assert len(passages) == 12, f"reading.passages count {len(passages)} != 12"
    assert len(paraphrases) >= 150, f"reading.paraphrases count {len(paraphrases)} < 150"
    assert len(upgrades) >= 140, f"writing.upgrades count {len(upgrades)} < 140"
    assert len(error_fixes) >= 100, f"writing.errorFixes count {len(error_fixes)} < 100"
    assert len(nat_phrases) >= 50, f"speaking.naturalPhrases count {len(nat_phrases)} < 50"
    assert len(frameworks) >= 35, f"speaking.part23Frameworks count {len(frameworks)} < 35"
    assert len(pron_traps) >= 45, f"speaking.pronunciationTraps count {len(pron_traps)} < 45"
    assert speaking_total >= 130, f"speaking total {speaking_total} < 130"

    # Unique ID check across whole dataset
    all_ids: set[str] = set()

    def check_id(val: str):
        assert val not in all_ids, f"Duplicate ID: {val}"
        all_ids.add(val)

    valid_lst_cats = {"spelling_trap", "number_date", "minimal_pair", "section4_academic"}
    for item in listening:
        check_id(item["id"])
        assert item["category"] in valid_lst_cats, f"Bad category: {item['category']}"
        assert item["word"].lower() in item["audioText"].lower(), (
            f"Listening word '{item['word']}' missing from audioText: {item['audioText']}"
        )
        assert len(item["distractors"]) >= 3
        assert item["word"].lower() not in [d.lower() for d in item["distractors"]]

    expected_codes = [f"A{i:02d}" for i in range(1, 13)]
    actual_codes = [p["code"] for p in passages]
    assert actual_codes == expected_codes, f"Codes mismatch: {actual_codes}"

    for p in passages:
        check_id(p["id"])
        full_text = " ".join(p["paragraphs"])
        wc = len(full_text.split())
        assert 150 <= wc <= 220, f"Passage {p['code']} word count {wc} outside 150-220!"
        assert len(p["tfngQuestions"]) >= 3, f"Passage {p['code']} has < 3 TFNG questions"
        assert len(p["paraphraseTargets"]) >= 3, f"Passage {p['code']} has < 3 paraphraseTargets"
        for h in p["highlights"]:
            assert h["phrase"].lower() in full_text.lower(), (
                f"Highlight '{h['phrase']}' not found in passage {p['code']}"
            )
        for q in p["tfngQuestions"]:
            check_id(q["id"])
            assert q["answer"] in {"TRUE", "FALSE", "NOT GIVEN"}
        for pt in p["paraphraseTargets"]:
            check_id(pt["id"])
            assert pt["targetInPassage"].lower() in full_text.lower(), (
                f"Paraphrase target '{pt['targetInPassage']}' not in passage {p['code']}"
            )
            assert len(pt["distractors"]) >= 3

    for pr in paraphrases:
        check_id(pr["id"])
        assert len(pr["distractors"]) >= 3

    for up in upgrades:
        check_id(up["id"])
        assert up["taskType"] in {"Task 1", "Task 2"}
        assert up["targetChunk"] in up["band8Sentence"], (
            f"targetChunk '{up['targetChunk']}' not in band8Sentence: {up['band8Sentence']}"
        )
        assert len(up["distractors"]) >= 3
        assert up["targetChunk"] not in up["distractors"]

    for ef in error_fixes:
        check_id(ef["id"])
        assert ef["errorSpan"] in ef["sentenceWithError"]
        assert ef["sentenceWithError"].replace(ef["errorSpan"], ef["correction"], 1) == ef["fullCorrectSentence"]
        assert len(ef["distractors"]) >= 3
        assert ef["correction"] not in ef["distractors"]

    for sp in nat_phrases:
        check_id(sp["id"])
        assert len(sp["distractors"]) >= 3

    for fw in frameworks:
        check_id(fw["id"])
        assert fw["part"] in {"Part 2", "Part 3"}
        assert 3 <= len(fw["steps"]) <= 4, f"Framework {fw['id']} has {len(fw['steps'])} steps"

    for pt in pron_traps:
        check_id(pt["id"])
        assert 0 <= pt["stressIndex"] < len(pt["syllables"]), (
            f"Invalid stressIndex {pt['stressIndex']} for {pt['word']} ({pt['syllables']})"
        )


def main() -> None:
    anki_decks = load_anki_subdecks()
    print(f"Loaded {len(anki_decks)} target Anki sub-decks:")
    for dname, notes in sorted(anki_decks.items()):
        print(f"  - {len(notes):3d} notes | {dname}")

    listening = build_listening(anki_decks)
    passages = build_reading_passages(anki_decks)
    paraphrases = build_paraphrases(anki_decks)
    upgrades = build_writing_upgrades(anki_decks)
    error_fixes = build_writing_error_fixes()
    nat_phrases = build_speaking_phrases(anki_decks)
    frameworks = build_speaking_frameworks(anki_decks)
    pron_traps = build_pronunciation_traps(anki_decks)

    data = {
        "metadata": {
            "title": "IELTS 8.0 Four Skills Dataset",
            "version": "1.0.0",
            "source": "Anki IELTS 8.0 sub-decks + Cambridge IELTS 8.0 curated expansion",
            "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "counts": {
                "listening": len(listening),
                "readingPassages": len(passages),
                "readingParaphrases": len(paraphrases),
                "writingUpgrades": len(upgrades),
                "writingErrorFixes": len(error_fixes),
                "speakingNaturalPhrases": len(nat_phrases),
                "speakingFrameworks": len(frameworks),
                "speakingPronunciationTraps": len(pron_traps),
                "speakingTotal": len(nat_phrases) + len(frameworks) + len(pron_traps),
            },
        },
        "listening": listening,
        "reading": {
            "passages": passages,
            "paraphrases": paraphrases,
        },
        "writing": {
            "upgrades": upgrades,
            "errorFixes": error_fixes,
        },
        "speaking": {
            "naturalPhrases": nat_phrases,
            "part23Frameworks": frameworks,
            "pronunciationTraps": pron_traps,
        },
    }

    validate_dataset(data)

    os.makedirs(os.path.dirname(OUT_JSON_PATH), exist_ok=True)
    with open(OUT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("\n[OK] Validation passed! Generated:", OUT_JSON_PATH)
    print(json.dumps(data["metadata"]["counts"], indent=2))
    print("\nPassage word counts:")
    for p in passages:
        wc = len(" ".join(p["paragraphs"]).split())
        print(f"  {p['code']}: {wc} words | {len(p['highlights'])} highlights | {len(p['tfngQuestions'])} TFNG | {len(p['paraphraseTargets'])} paraphrases")


if __name__ == "__main__":
    main()
