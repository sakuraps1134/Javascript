$(function () {

  // 再読み込みボタン
  $(document).on('click', '.reload-button', function () {
    init();
    $('.reload-button').addClass('on-tap');
    setTimeout(() => $('.reload-button').removeClass('on-tap'), 1000);
  });

  // 初期化
  function init() {
    fetch('https://busnavi-railway.nnr.co.jp/tenjin_omuta/tenjin-omuta.json')
      .then(res => res.json())
      .then(data => {
        displayTrainPosition(data);
        displayTrainNumber(data);
        checkRedFrame();
        checkDelay();
      })
      .catch(err => console.error('取得エラー:', err));
  }

  // 列車位置表示
  function displayTrainPosition(data) {
    $('.rowcol').empty();

    $(data.locationObjects).each(function () {
      const trainDirection =
        this.trainDirection === '1' ? 'up-direction' : 'down-direction';

      const delayImage = this.delay
        ? `<img class="delay-image" src="common/img/delay/${this.delay}.png"/>`
        : '';

      let doors = '';
      let cars = '';

      if (this.trainInfoObjects?.length > 0) {
        doors = this.trainInfoObjects[0].doorsOfCar || '';
        cars = this.trainInfoObjects[0].carsOfTrain || '';
      }

      let infoPosition = '';
      if (['3', '4', '6'].includes(this.locationCol)) {
        infoPosition = 'bottom:-2px; left:50%; transform:translateX(-50%);';
      } else if (['1', '2', '5'].includes(this.locationCol)) {
        infoPosition = 'top:-2px; left:50%; transform:translateX(-50%);';
      }

      let iconObject = `
        <div class="icon-object ${trainDirection}"
             data-row="${this.locationRow}"
             data-col="${this.locationCol}">
          <img class="train-icon"
               src="common/img/train_position_icons/${this.trainIconTypeImage}"/>
          ${delayImage}
      `;

      if (cars && doors && infoPosition) {
        iconObject += `
          <div class="door-info"
               style="position:absolute; ${infoPosition}
               font-size:12px; color:white;
               background:rgba(0,0,0,0.6);
               padding:1px 3px; border-radius:0;
               white-space:nowrap;">
            ${cars}${doors}
          </div>
        `;
      }

      iconObject += '</div>';

      $(`.row${this.locationRow}.col${this.locationCol}`).append(iconObject);
    });
  }

  // 列車番号表示
  function displayTrainNumber(data) {
    $('.train-number').remove();

    $(data.locationObjects).each(function () {
      if (!this.trainInfoObjects?.length) return;

      const trainNumber = this.trainInfoObjects[0].trainNumber || '';
      if (!trainNumber) return;

      const indexes = [3, 5, 7, 9];
      let extracted = indexes.map(i => trainNumber[i] || '').join('').toUpperCase();

      const map = { '7': 'G', 'A': 'J', 'B': 'K', 'C': 'L', '8': 'H', 'D': 'H' };
      const thirdOriginal = trainNumber[2] || '';
      const fifthOriginal = trainNumber[4] || '';

      let convertedFirst = extracted[0] || '';

      if (convertedFirst === '1') {
        convertedFirst = thirdOriginal === '4' ? 'A' : '1';
      } else if (convertedFirst === '3') {
        convertedFirst = thirdOriginal === '5' ? 'S' : '3';
      } else if (convertedFirst === '7') {
        convertedFirst = thirdOriginal === '4' ? 'G' : '7';
      } else {
        convertedFirst = map[convertedFirst] || convertedFirst;
      }

      if (extracted[1] === '4') {
        extracted =
          extracted[0] +
          (fifthOriginal === '4' ? 'D' : '4') +
          extracted.slice(2);
      }

      extracted = convertedFirst + extracted.slice(1);

      let bgColor = 'rgba(0,0,255,0.6)';
      if (/[A-Z]/.test(convertedFirst)) {
        bgColor =
          convertedFirst === 'A'
            ? 'rgba(255,0,0,0.6)'
            : 'rgba(0,128,0,0.6)';
      }

      let numberPosition = '';
      if (['3', '4', '6'].includes(this.locationCol)) {
        numberPosition = 'top:-14px; left:50%; transform:translateX(-50%);';
      } else {
        numberPosition = 'bottom:-14px; left:50%; transform:translateX(-50%);';
      }

      const numberHtml = `
        <div class="train-number"
             style="position:absolute; ${numberPosition}
             font-size:12px; color:#fff;
             background:${bgColor};
             padding:1px 5px; border-radius:3px;
             white-space:nowrap;">
          ${extracted}
        </div>
      `;

      const target = $(`.row${this.locationRow}.col${this.locationCol}`);
      if (target.length) {
        if (target.css('position') === 'static') {
          target.css('position', 'relative');
        }
        target.append(numberHtml);
      }
    });
  }

  // 臨時列車検知
  function checkRedFrame() {
    $('.red-frame-notice').remove();

    let hasRedFrame = false;
    $('.train-number').each(function () {
      const text = $(this).text().trim();
      if (/^[A-Za-z0-9]9/.test(text) || /^[A-Za-z0-9]D/.test(text)) {
        hasRedFrame = true;
        return false;
      }
    });

    if (hasRedFrame) {
      const notice = $('<span class="red-frame-notice">')
        .text('臨時列車がいます')
        .css({
          position: 'absolute',
          top: '3px',
          left: '3px',
          color: 'white',
          background: 'red',
          fontWeight: 'bold',
          fontSize: '15px',
          padding: '2px 6px',
          borderRadius: '4px',
          zIndex: 10
        });

      $('.header-block').append(notice);
    }
  }

  // 遅延判定
  function checkDelay() {
    $('.train-status').remove();

    const delayPattern = /common\/img\/delay\/(longdelay|[1-5][0-9])\.png$/;
    const hasDelay = Array.from(document.images).some(img =>
      delayPattern.test(img.src)
    );

    const header = document.querySelector('.header-block');
    if (!header) return;

    if (getComputedStyle(header).position === 'static') {
      header.style.position = 'relative';
    }

    const text = document.createElement('div');
    text.className = 'train-status';
    text.textContent = hasDelay ? '遅延発生' : '通常運行';
    text.style.cssText = `
      position:absolute;
      left:10px;
      top:80%;
      transform:translateY(-50%);
      color:white;
      font-size:15px;
      font-weight:300;
      background:${hasDelay ? 'rgba(255,0,0,0.5)' : 'rgba(0,0,255,0.5)'};
      padding:2px 8px;
      border-radius:4px;
      pointer-events:none;
      z-index:9999;
      white-space:nowrap;
    `;

    header.appendChild(text);
  }

  // 初回実行
  init();
});
