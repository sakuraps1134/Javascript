(function () {
  'use strict';

  if (window.__NISHITETSU_VEHICLE_LOADED__) return;
  window.__NISHITETSU_VEHICLE_LOADED__ = true;

  function tr(n) {
    if (typeof n !== "string" || n.length !== 16) return null;
    let e = n[3] + n[5] + n[7] + n[9];
    const m = { "1": "A", "7": "G", "D": "H", "A": "J", "B": "K", "C": "L", "5": "S" };
    if (n[2] === "4" && m[e[0]]) return m[e[0]] + e.slice(1);
    return e;
  }

  function api() {
    const j = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    const h = String(j.getHours()).padStart(2, "0");
    const m = String(j.getMinutes()).padStart(2, "0");
    const y = j.getFullYear();
    const M = String(j.getMonth() + 1).padStart(2, "0");
    const d = String(j.getDate()).padStart(2, "0");
    const day = j.getDay();
    const id = day === 0 ? 92 : day === 6 ? 30 : 29;
    const b = "https://www.elesite-next.com/fastapi/get_train_position";

    return Promise.all(
      ["nishitetsu_omuta", "nishitetsu_dazaifu"].map(r =>
        fetch(`${b}?rosen_code=${r}&current_time=${h}:${m}&day_id=${id}&select_date=${y}-${M}-${d}&second=0`)
          .then(x => x.json())
      )
    ).then(r => r.flatMap(v => v.train_position || []));
  }

  $(document).on("click", ".icon-object", function () {
    setTimeout(() => {
      const o = $(".icon-object.icon-hidden");
      if (!o.length) return;

      const r = o.attr("data-row");
      const c = o.attr("data-col");

      if (!window.trainDetailArray) return;

      const obj = get_obj_by_key_value01(
        trainDetailArray,
        "locationRow", r,
        "locationCol", c
      );

      if (!obj || !obj[0]?.trainInfoObjects?.length) return;

      const k = tr(obj[0].trainInfoObjects[0].trainNumber);
      if (!k) return;

      api().then(list => {
        const t = list.find(v => v.retsuban === k);
        let x = "車両の情報がありません";

        if (t) {
          if (t.sharyo_list && String(t.sharyo_list).trim() !== "") {
            x = t.sharyo_list;
          } else if (t.shotei && String(t.shotei).trim() !== "") {
            x = t.shotei;
          }
        }

        $('.inner h4').text(x);
      });
    }, 100);
  });

})();
