import { html, svg } from 'lit';

export const apprentice_viewbox = '0 0 245.89 350.07';
export const hero_viewbox = '0 0 294.54 401.1';

// TODO: Dedupe the styles below.
export const apprentice_styles = html`
  <style>
    .base-isolate,
    .body-1,
    .axe-6,
    .drill-1,
    .missile-1,
    .slicer-1,
    .sword-1,
    .club-1,
    .hand-1,
    .shield-1,
    .dagger-1,
    .torch-1,
    .antenna-1,
    .right-hand-1 {
      isolation: isolate;
    }

    .base-dark,
    .body-2,
    .axe-3,
    .drill-2,
    .missile-3,
    .slicer-2,
    .sword-3,
    .club-4,
    .hand-5,
    .shield-5,
    .dagger-5,
    .torch-5,
    .right-hand-3 {
      fill: #2a3e51;
    }

    .base-4,
    .body-4,
    .axe-4,
    .drill-6,
    .missile-5,
    .slicer-11,
    .sword-4,
    .club-3,
    .hand-4,
    .shield-4,
    .dagger-4,
    .torch-4,
    .right-hand-5 {
      fill: url(#_4);
    }

    .base-3,
    .body-5,
    .axe-20,
    .drill-15,
    .missile-11,
    .slicer-12,
    .sword-14,
    .club-5,
    .hand-6,
    .shield-6,
    .dagger-6,
    .torch-6,
    .right-hand-11 {
      fill: url(#_3);
    }

    .body-6,
    .dagger-10 {
      fill: #aeaeaf;
    }

    .base-7,
    .body-7,
    .axe-22,
    .drill-3,
    .missile-13,
    .slicer-13,
    .sword-16,
    .club-9,
    .hand-9,
    .shield-9,
    .dagger-9,
    .torch-9,
    .right-hand-13 {
      fill: #477087;
    }

    .base-2,
    .body-8,
    .axe-16,
    .drill-10,
    .missile-2,
    .slicer-8,
    .sword-10,
    .antenna-5,
    .right-hand-2 {
      fill: url(#_2);
    }

    .body-9,
    .antenna-2 {
      fill: #4b6d73;
    }

    .body-10,
    .body-17,
    .body-18,
    .body-19,
    .body-21,
    .body-24,
    .body-27,
    .club-8,
    .axe-17,
    .axe-23,
    .drill-11,
    .drill-16,
    .missile-14,
    .missile-4,
    .slicer-14,
    .slicer-9,
    .sword-11,
    .sword-17,
    .hand-8,
    .shield-8,
    .dagger-21,
    .dagger-8,
    .torch-8,
    .antenna-6,
    .antenna-9,
    .right-hand-14 {
      mix-blend-mode: screen;
    }

    .base-40,
    .body-10,
    .axe-17,
    .drill-11,
    .missile-4,
    .slicer-9,
    .sword-11,
    .club-8,
    .hand-8,
    .shield-8,
    .dagger-8,
    .torch-8,
    .antenna-9,
    .right-hand-4,
    .right-hand-14 {
      fill: url(#_40);
    }

    .base-4-2,
    .body-11,
    .axe-14,
    .drill-7,
    .missile-7,
    .club-14,
    .hand-10,
    .shield-10,
    .dagger-25,
    .torch-16,
    .right-hand-7 {
      fill: url(#_4-2);
    }

    .base-4-3,
    .body-13,
    .axe-15,
    .drill-8,
    .missile-8,
    .sword-8,
    .right-hand-8 {
      fill: url(#_4-3);
    }

    .body-14 {
      fill: url(#_3-2);
    }

    .base-4-4,
    .body-15,
    .axe-19,
    .drill-9,
    .missile-10,
    .sword-9,
    .right-hand-10 {
      fill: url(#_4-4);
    }

    .body-16 {
      fill: url(#_3-3);
    }

    .body-17 {
      fill: url(#_171);
    }

    .body-18 {
      fill: url(#_171-2);
    }

    .base-40-2,
    .body-19,
    .axe-23,
    .drill-16,
    .missile-14,
    .slicer-14,
    .sword-17,
    .right-hand-14 {
      fill: url(#_40-2);
    }

    .body-20,
    .drill-14,
    .sword-13 {
      fill: url(#_4-5);
    }

    .body-21 {
      fill: url(#_171-3);
    }

    .base-grey,
    .axe-21,
    .drill-5,
    .missile-12,
    .slicer-5,
    .sword-15,
    .club-6,
    .hand-7,
    .shield-7,
    .dagger-7,
    .torch-7,
    .right-hand-12 {
      fill: #99999a;
    }

    .body-22 {
      fill: url(#_4-6);
    }
    .body-23,
    .shield-12,
    .dagger-24,
    .pattern-2-2 {
      fill: url(#_160);
    }
    .body-24 {
      fill: url(#_166);
    }
    .body-25 {
      fill: url(#_4-7);
    }
    .body-26 {
      fill: url(#_4-8);
    }
    .body-27 {
      fill: url(#_171-4);
    }

    .axe-13,
    .drill-17,
    .antenna-3,
    .right-hand-15 {
      fill: #c62026;
    }

    .axe-1,
    .axe-11,
    .axe-5 {
      fill: #e1e1e1;
    }
    .axe-11,
    .axe-6,
    .dagger-21,
    .torch-15 {
      fill: #fff;
    }
    .club-11 {
      fill: #d3d3d3;
    }
    .axe-6 {
      opacity: 0.27;
    }
    .axe-7 {
      fill: #999696;
    }
    .axe-8 {
      fill: #f3f1f1;
    }
    .axe-9 {
      fill: #bbbaba;
    }
    .axe-10,
    .club-10 {
      fill: #2d353a;
    }
    .axe-11 {
      opacity: 0.39;
    }
    .axe-12,
    .club-13,
    .sword-6 {
      fill: #13181d;
    }

    .drill-4 {
      fill: url(#drill-gradient);
    }

    .missile-15 {
      fill: #131f32;
    }

    .slicer-3 {
      fill: #989898;
    }
    .slicer-4 {
      fill: url(#slicer-gradient);
    }

    .sword-5 {
      fill: #c0c0c0;
    }

    .sword-7 {
      fill: #2d353a;
    }

    .sword-18,
    .shield-2,
    .pattern-2-1 {
      fill: #d7d7d7;
    }

    .club-11 {
      stroke: #939393;
      stroke-miterlimit: 10;
      stroke-width: 0.25px;
    }
    .club-12 {
      fill: url(#club-gradient);
    }

    .shield-11 {
      fill: #bfbfbf;
    }
    .shield-13,
    .pattern-2-3 {
      fill: url(#_160-2);
    }
    .shield-15 {
      fill: url(#_160-4);
    }
    .shield-16 {
      fill: url(#_160-5);
    }
    .shield-17 {
      fill: url(#_160-6);
    }
    .dagger-11,
    .dagger-12,
    .dagger-13,
    .dagger-14,
    .dagger-15,
    .dagger-16,
    .dagger-17,
    .dagger-18,
    .dagger-2 {
      stroke-miterlimit: 10;
    }
    .dagger-11,
    .dagger-12,
    .dagger-13,
    .dagger-14,
    .dagger-15,
    .dagger-16,
    .dagger-17,
    .dagger-18 {
      stroke-width: 0.09px;
    }
    .dagger-11 {
      fill: url(#dagger-gradient);
      stroke: url(#dagger-gradient-2);
    }
    .dagger-12 {
      fill: url(#dagger-gradient-3);
      stroke: url(#dagger-gradient-4);
    }
    .dagger-13 {
      fill: url(#dagger-gradient-5);
      stroke: url(#dagger-gradient-6);
    }
    .dagger-14 {
      fill: url(#dagger-gradient-7);
      stroke: url(#dagger-gradient-8);
    }
    .dagger-15 {
      fill: url(#dagger-gradient-9);
      stroke: url(#dagger-gradient-10);
    }
    .dagger-16 {
      fill: url(#dagger-gradient-11);
      stroke: url(#dagger-gradient-12);
    }
    .dagger-17 {
      fill: url(#dagger-gradient-13);
      stroke: url(#dagger-gradient-14);
    }
    .dagger-18 {
      fill: url(#dagger-gradient-15);
      stroke: url(#dagger-gradient-16);
    }
    .dagger-19 {
      fill: #a8a9ac;
    }
    .dagger-20 {
      fill: #d2d3d4;
    }
    .dagger-22 {
      fill: url(#dagger-gradient-17);
    }
    .dagger-23 {
      fill: none;
      stroke: #2a3e51;
      stroke-width: 1.3px;
    }

    .torch-10 {
      fill: url(#torch-gradient);
    }
    .torch-11 {
      fill: url(#torch-gradient-2);
    }
    .torch-12 {
      fill: #b2b2b2;
    }
    .torch-13 {
      fill: #575756;
    }
    .torch-14 {
      fill: #fcea10;
    }

    .pattern-1-1 {
      fill: url(#pattern-1-gradient);
    }
    .pattern-1-2 {
      fill: url(#pattern-1-gradient-2);
    }

    .antenna-4 {
      fill: #efefef;
    }
    .antenna-6 {
      fill: #fff7cd;
      opacity: 0.85;
    }
    .antenna-7 {
      fill: url(#_2-2);
    }
    .antenna-8 {
      fill: #3c5a5f;
    }

    .hair-1 {
      fill: #8217ce;
    }
    .hair-2 {
      fill: #bc43d1;
    }
  </style>
`;

export const apprentice_colours = (r = 255, g = 255, b = 255) => html`
  <style>
    .body-3,
    .body-12,
    .axe-2,
    .axe-18,
    .drill-12,
    .drill-13,
    .missile-6,
    .missile-9,
    .slicer-6,
    .slicer-7,
    .slicer-10,
    .sword-2,
    .sword-12,
    .club-7,
    .club-2,
    .hand-2,
    .hand-3,
    .shield-3,
    .dagger-2,
    .dagger-3,
    .torch-2,
    .torch-3,
    .right-hand-6,
    .right-hand-9 {
      fill: rgb(${r - 80}, ${g - 80}, ${b - 80});
    }

    .gradient-primary {
      stop-color: rgb(${r}, ${g}, ${b});
    }

    .gradient-stop1 {
      stop-color: rgb(${r - 4}, ${g - 4}, ${b - 4});
    }

    .gradient-stop2 {
      stop-color: rgb(${r - 6}, ${g - 6}, ${b - 6});
    }

    .gradient-stop3 {
      stop-color: rgb(${r - 26}, ${g - 26}, ${b - 26});
    }

    .gradient-stop4 {
      stop-color: rgb(${r - 32}, ${g - 32}, ${b - 32});
    }

    .gradient-stop5 {
      stop-color: rgb(${r - 40}, ${g - 40}, ${b - 40});
    }

    .gradient-alt-stop1 {
      stop-color: rgb(${r - 24}, ${g - 24}, ${b - 24});
    }
  </style>
`;

export const apprentice_gradients = svg`
  <linearGradient id="_4" gradientUnits="userSpaceOnUse">
    <stop offset="0.04" class="gradient-primary" />
    <stop offset="0.3" class="gradient-stop1" />
    <stop offset="0.55" class="gradient-stop2" />
    <stop offset="0.7" class="gradient-stop3" />
    <stop offset="0.8" class="gradient-stop4" />
    <stop offset="1" class="gradient-stop5" />
  </linearGradient>
  <linearGradient id="_3" x1="183.91" y1="238.22" x2="189.47" y2="263.76" gradientUnits="userSpaceOnUse">
    <stop offset="0" class="gradient-primary" />
    <stop offset="0.84" class="gradient-alt-stop1" />
  </linearGradient>
  <linearGradient id="_2" x1="139.97" y1="221.18" x2="104.24" y2="222.27" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#f2f2f2" />
    <stop offset="0.42" stop-color="#b5c5c5" />
    <stop offset="0.84" stop-color="#759595" />
  </linearGradient>
  <linearGradient id="_2-2" x1="84.06" y1="100.87" x2="64.87" y2="130.18" xlink:href="#_2"/>
  <linearGradient id="_40" x1="131.59" y1="212.19" x2="125.45" y2="231.82" gradientUnits="userSpaceOnUse">
    <stop offset="0.17" stop-color="#bdb48e" />
    <stop offset="0.26" stop-color="#b3ab87" />
    <stop offset="0.41" stop-color="#999273" />
    <stop offset="0.6" stop-color="#6e6953" />
    <stop offset="0.82" stop-color="#333126" />
    <stop offset="1" />
  </linearGradient>
  <linearGradient id="_4-2" x1="131.83" y1="221.6" x2="117.65" y2="265.97" xlink:href="#_4" />
  <linearGradient id="_4-3" x1="96.42" y1="235.65" x2="77.33" y2="295.79" xlink:href="#_4" />
  <linearGradient id="_3-2" x1="94.59" y1="236.3" x2="81" y2="279.12" xlink:href="#_3" />
  <linearGradient id="_4-4" x1="44.17" y1="236.39" x2="67.49" y2="282.89" xlink:href="#_4" />
  <linearGradient id="_3-3" x1="50" y1="235.86" x2="62.55" y2="260.88" xlink:href="#_3" />
  <linearGradient id="_171" x1="55.15" y1="231.38" x2="56.1" y2="278.43" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#c3bea9" />
    <stop offset="0.5" stop-color="#636156" />
    <stop offset="1" />
  </linearGradient>
  <linearGradient id="_171-2" x1="87.84" y1="235.21" x2="92.57" y2="292.12" xlink:href="#_171" />
  <linearGradient id="_40-2" x1="145.69" y1="219.18" x2="118.42" y2="250.64" xlink:href="#_40" />
  <linearGradient id="_4-5" x1="205.32" y1="179.43" x2="205.09" y2="231.05" xlink:href="#_4" />
  <linearGradient id="_171-3" x1="154.1" y1="110.14" x2="122.86" y2="181.1" xlink:href="#_171" />
  <linearGradient id="_4-6" x1="147.71" y1="122.23" x2="120.99" y2="208.78" gradientTransform="translate(27.28 -19.37) rotate(9.09)" xlink:href="#_4"/>
  <linearGradient id="_4-7" x1="147.61" y1="109.28" x2="107.97" y2="230.4" >
    <stop offset="0.04" stop-color="#fff" />
    <stop offset="1" stop-color="#d7d7d7" />
  </linearGradient>
  <linearGradient
    id="_4-8"
    x1="147.71"
    y1="122.23"
    x2="120.99"
    y2="208.78"
    gradientTransform="translate(27.28 -19.37) rotate(9.09)" xlink:href="#_4-7" />
  <radialGradient id="_160" cx="-237.68" cy="147.16" r="32.5" gradientTransform="translate(408.08) scale(1.1 1)" gradientUnits="userSpaceOnUse">
      <stop offset="0.01" stop-color="#22577e"/>
      <stop offset="0.25" stop-color="#204f77"/>
      <stop offset="0.63" stop-color="#1c3b62"/>
      <stop offset="1" stop-color="#162048"/>
  </radialGradient>
  <radialGradient id="_160-2" cx="193.59" cy="226.98" r="39.49" gradientTransform="matrix(1, 0, 0, 1, 0, 0)" xlink:href="#_160"/>
  <radialGradient id="_160-3" cx="324.31" cy="581.82" r="25.53" gradientTransform="matrix(-0.83, -0.47, 1.68, -1.89, -497.79, 1459.76)" xlink:href="#_160"/>
  <radialGradient id="_160-4" cx="192.52" cy="175.42" r="10.56" gradientTransform="matrix(1.01, 0, 0, 1.02, 1.21, 21.11)" xlink:href="#_160"/>
  <radialGradient id="_160-5" cx="735.31" cy="86" r="5.19" gradientTransform="matrix(0.91, 0.45, -0.45, 0.92, -422.95, -190.9)" xlink:href="#_160"/>
  <radialGradient id="_160-6" cx="277.24" cy="203.11" r="3.34" gradientTransform="matrix(1.01, 0.06, -0.05, 1.02, -72.56, 5.67)" xlink:href="#_160"/>
  <linearGradient id="_166" x1="153.04" y1="134.66" x2="132.82" y2="167.95" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#848174"/>
      <stop offset="0.73" stop-color="#252420"/>
      <stop offset="1"/>
  </linearGradient>
  <linearGradient id="_171-4" x1="149.98" y1="122.69" x2="127.15" y2="184.68" xlink:href="#_171"/>
  <linearGradient id="drill-gradient" x1="-92.33" y1="1165.17" x2="-130.3" y2="1229.77" gradientTransform="translate(-531.01 -770.59) rotate(-37.17)" gradientUnits="userSpaceOnUse">
			<stop offset="0.16" stop-color="#fff" />
			<stop offset="0.35" stop-color="#fbfbfb" />
			<stop offset="0.54" stop-color="#f0f0ef" />
			<stop offset="0.63" stop-color="#e7e7e6" />
			<stop offset="0.74" stop-color="#d4d4d4" />
			<stop offset="0.98" stop-color="#a2a4a5" />
			<stop offset="1" stop-color="#9d9fa0" />
		</linearGradient>
    <linearGradient id="slicer-gradient" x1="-5.06" y1="276.56" x2="33.4" y2="322.38" gradientTransform="matrix(1.07, -0.11, 0.1, 0.91, 13.14, -15.97)" gradientUnits="userSpaceOnUse">
			<stop offset="0" stop-color="#a7a9aa" />
			<stop offset="0.01" stop-color="#a8aaab" />
			<stop offset="0.32" stop-color="#d8d8d8" />
			<stop offset="0.63" stop-color="#cdcecf" />
			<stop offset="1" stop-color="#c5c7c9" />
		</linearGradient>
    <linearGradient id="club-gradient" x1="-1.18" y1="-15.79" x2="82.1" y2="-15.79" gradientTransform="translate(98.11 102.42) rotate(-15.55)" gradientUnits="userSpaceOnUse">
      <stop offset="0.04" stop-color="#fff"/>
      <stop offset="0.19" stop-color="#fbfbfb"/>
      <stop offset="0.34" stop-color="#efefef"/>
      <stop offset="0.43" stop-color="#e5e5e4"/>
      <stop offset="0.62" stop-color="#dfdfde"/>
      <stop offset="1" stop-color="#d7d7d7"/>
    </linearGradient>
    <linearGradient id="dagger-gradient" x1="186.95" y1="215.2" x2="191.12" y2="215.2" gradientUnits="userSpaceOnUse">
      <stop offset="0.04" stop-color="#fff"/>
      <stop offset="0.23" stop-color="#fbfbfb"/>
      <stop offset="0.41" stop-color="#efefef"/>
      <stop offset="0.52" stop-color="#e5e5e4"/>
      <stop offset="0.68" stop-color="#dfdfde"/>
      <stop offset="1" stop-color="#d7d7d7"/>
    </linearGradient>
    <linearGradient id="dagger-gradient-2" x1="186.9" y1="215.2" x2="191.17" y2="215.2" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#e5e5e4"/>
      <stop offset="0.29" stop-color="#dfdfde"/>
      <stop offset="0.88" stop-color="#d7d7d7"/>
    </linearGradient>
    <linearGradient id="dagger-gradient-3" x1="186.97" y1="217.07" x2="191.14" y2="217.07" xlink:href="#dagger-gradient"/>
    <linearGradient id="dagger-gradient-4" x1="186.92" y1="217.07" x2="191.19" y2="217.07" xlink:href="#dagger-gradient-2"/>
    <linearGradient id="dagger-gradient-5" x1="186.97" y1="218.94" x2="191.14" y2="218.94" xlink:href="#dagger-gradient"/>
    <linearGradient id="dagger-gradient-6" x1="186.92" y1="218.94" x2="191.19" y2="218.94" xlink:href="#dagger-gradient-2"/>
    <linearGradient id="dagger-gradient-7" x1="186.95" y1="220.81" x2="191.12" y2="220.81" xlink:href="#dagger-gradient"/>
    <linearGradient id="dagger-gradient-8" x1="186.9" y1="220.81" x2="191.17" y2="220.81" xlink:href="#dagger-gradient-2"/>
    <linearGradient id="dagger-gradient-9" x1="186.94" y1="222.72" x2="191.11" y2="222.72" xlink:href="#dagger-gradient"/>
    <linearGradient id="dagger-gradient-10" x1="186.89" y1="222.72" x2="191.16" y2="222.72" xlink:href="#dagger-gradient-2"/>
    <linearGradient id="dagger-gradient-11" x1="186.96" y1="224.59" x2="191.13" y2="224.59" xlink:href="#dagger-gradient"/>
    <linearGradient id="dagger-gradient-12" x1="186.91" y1="224.59" x2="191.18" y2="224.59" xlink:href="#dagger-gradient-2"/>
    <linearGradient id="dagger-gradient-13" x1="186.96" y1="226.46" x2="191.13" y2="226.46" xlink:href="#dagger-gradient"/>
    <linearGradient id="dagger-gradient-14" x1="186.91" y1="226.46" x2="191.18" y2="226.46" xlink:href="#dagger-gradient-2"/>
    <linearGradient id="dagger-gradient-15" x1="186.94" y1="228.33" x2="191.11" y2="228.33" xlink:href="#dagger-gradient"/>
    <linearGradient id="dagger-gradient-16" x1="186.89" y1="228.33" x2="191.16" y2="228.33" xlink:href="#dagger-gradient-2"/>
    <linearGradient id="dagger-gradient-17" x1="189.01" y1="198.52" x2="189.01" y2="214.71" xlink:href="#dagger-gradient"/>
    <linearGradient id="torch-gradient" x1="169.41" y1="230.24" x2="183.09" y2="230.24" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#fff"/>
      <stop offset="0.84" stop-color="#e8e7e7"/>
    </linearGradient>
    <linearGradient id="torch-gradient-2" x1="172.73" y1="222.6" x2="216.21" y2="222.6" gradientTransform="translate(101.03 -57.82) rotate(22.71)" xlink:href="#torch-gradient"/>
    <linearGradient id="pattern-1-gradient" x1="150.25" y1="128.52" x2="121.27" y2="111.79" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#162048"/>
      <stop offset="1" stop-color="#22577e"/>
    </linearGradient>
    <linearGradient id="pattern-1-gradient-2" x1="157.06" y1="219.45" x2="113.95" y2="194.56" xlink:href="#pattern-1-gradient"/>
`;

export const hero_styles = html`
  <style>
    .body-1,
    .right-arm-1,
    .arrow-1,
    .axe-1,
    .gun-1,
    .chuck-1,
    .shield-1,
    .sword-1,
    .weapon-1,
    .left-arm-1,
    .fight-1,
    .flame-1,
    .flowers-1,
    .pet-1 {
      isolation: isolate;
    }
    .body-21,
    .arrow-10,
    .arrow-16,
    .arrow-18,
    .pow-20,
    .left-arm-11,
    .cat-16,
    .cat-17,
    .pet-38 {
      fill: #fff;
    }
    .body-2,
    .left-arm-11,
    .pet-38 {
      mix-blend-mode: soft-light;
    }
    .body-3,
    .arrow-8,
    .sword-12,
    .flame-12,
    .cat-1,
    .pet-19 {
      fill: url(#_160);
    }
    .body-4,
    .arrow-9,
    .cat-6,
    .pet-20 {
      fill: url(#_160-2);
    }
    .body-5,
    .weapon-35,
    .weapon-40,
    .weapon-45,
    .weapon-50,
    .weapon-55,
    .weapon-60,
    .chuck-16,
    .chuck-18,
    .chuck-2 {
      mix-blend-mode: multiply;
    }
    .body-6 {
      fill: #1e2f32;
    }
    .body-7,
    .right-arm-3,
    .arrow-24,
    .axe-4,
    .gun-18,
    .chuck-7,
    .sword-17,
    .weapon-3,
    .left-arm-3,
    .fight-4,
    .flame-6,
    .flowers-4 {
      fill: url(#_3);
    }
    .body-8,
    .right-arm-6,
    .axe-11,
    .chuck-11,
    .weapon-7,
    .left-arm-8,
    .fight-11,
    .flame-13,
    .flowers-44 {
      fill: url(#_3-2);
    }
    .body-11,
    .right-arm-15,
    .arrow-12,
    .axe-9,
    .gun-4,
    .chuck-6,
    .pow-5,
    .sword-4,
    .weapon-13,
    .left-arm-12,
    .fight-9,
    .flame-4,
    .flowers-9 {
      fill: url(#_4);
    }
    .body-12,
    .body-15,
    .body-17,
    .body-19,
    .body-23,
    .body-28,
    .body-32,
    .body-34,
    .right-arm-13,
    .arrow-25,
    .axe-10,
    .axe-52,
    .axe-54,
    .axe-8,
    .gun-11,
    .gun-12,
    .gun-19,
    .chuck-13,
    .shield-14,
    .shield-15,
    .sword-19,
    .weapon-11,
    .left-arm-10,
    .left-arm-13,
    .fight-10,
    .fight-8,
    .flame-5,
    .flowers-10,
    .flowers-8,
    .pet-23,
    .pet-25,
    .pet-27,
    .pet-29 {
      mix-blend-mode: screen;
    }
    .body-12,
    .right-arm-13,
    .arrow-25,
    .axe-8,
    .gun-19,
    .chuck-13,
    .shield-14,
    .weapon-11,
    .left-arm-10,
    .fight-8,
    .flame-5,
    .flowers-8 {
      fill: url(#_40);
    }
    .body-13,
    .arrow-13,
    .axe-12,
    .axe-13,
    .gun-6 {
      fill: url(#_4-2);
    }
    .body-14,
    .shield-14,
    .cat-11,
    .pet-22 {
      fill: url(#_160-3);
    }
    .body-15,
    .pet-23 {
      fill: url(#_166);
    }
    .body-16,
    .right-arm-10,
    .axe-6,
    .gun-10,
    .chuck-12,
    .weapon-8,
    .left-arm-6,
    .fight-6,
    .flowers-6 {
      fill: url(#_2);
    }
    .body-17,
    .axe-10,
    .shield-15,
    .left-arm-13,
    .fight-10,
    .flowers-10 {
      fill: url(#_40-2);
    }
    .body-18,
    .arrow-20,
    .gun-14 {
      fill: url(#_4-3);
    }
    .body-19,
    .axe-52 {
      fill: url(#_40-3);
    }
    .body-20,
    .cat-12,
    .pet-24 {
      fill: url(#_160-4);
    }
    .body-22,
    .axe-50,
    .sword-6 {
      fill: url(#_2-2);
    }
    .body-23,
    .axe-54 {
      fill: url(#_40-4);
    }
    .body-24,
    .right-arm-5,
    .arrow-2,
    .axe-2,
    .gun-5,
    .chuck-9,
    .pow-2,
    .shield-4,
    .sword-5,
    .weapon-5,
    .left-arm-4,
    .fight-2,
    .flame-10,
    .flowers-2,
    .cat-2,
    .pet-16 {
      fill: #2a3e51;
    }
    .body-25,
    .right-arm-7,
    .axe-35,
    .chuck-24,
    .weapon-106 {
      fill: url(#_3-3);
    }
    .body-26,
    .arrow-21,
    .gun-15 {
      fill: url(#_4-4);
    }
    .body-28 {
      fill: url(#_40-5);
    }
    .body-29 {
      fill: url(#_2-4-1);
    }
    .body-30,
    .shield-5 {
      fill: url(#_2-4);
    }
    .body-31,
    .right-arm-12,
    .arrow-5,
    .axe-36,
    .gun-9,
    .chuck-10,
    .pow-3,
    .shield-2,
    .sword-18,
    .weapon-10,
    .left-arm-9,
    .flame-11,
    .cat-3 {
      fill: #477087;
    }
    .body-32 {
      fill: url(#_190);
    }
    .body-33,
    .right-arm-9,
    .axe-47,
    .chuck-25,
    .weapon-107 {
      fill: url(#_3-4);
    }
    .body-34 {
      fill: url(#_190-2);
    }
    .right-arm-14,
    .arrow-26,
    .axe-53,
    .gun-20,
    .chuck-27,
    .sword-20,
    .weapon-12 {
      fill: #c62026;
    }
    .arrow-11,
    .arrow-4,
    .gun-21 {
      fill: #d7d7d7;
    }
    .arrow-16,
    .arrow-4,
    .arrow-7,
    .arrow-10,
    .arrow-11,
    .arrow-18 {
      opacity: 0.16;
    }
    .arrow-14 {
      fill: #363636;
    }
    .arrow-15,
    .arrow-19 {
      fill: #737374;
    }
    .arrow-15 {
      opacity: 0.6;
    }
    .arrow-17 {
      fill: #90908f;
    }
    .arrow-23,
    .gun-17 {
      fill: url(#_4-5);
    }
    .axe-14 {
      fill: url(#axe);
    }
    .axe-15 {
      fill: #4f4a58;
    }
    .axe-16 {
      fill: url(#axe-2);
    }
    .axe-17 {
      fill: url(#axe-3);
    }
    .axe-18 {
      fill: url(#axe-4);
    }
    .axe-19 {
      fill: #281939;
    }
    .axe-20 {
      fill: url(#axe-5);
    }
    .axe-21 {
      fill: #aeb3b2;
    }
    .axe-22 {
      fill: #4e435b;
    }
    .axe-23 {
      fill: #8b939c;
    }
    .axe-24 {
      fill: #abb3b5;
    }
    .axe-25 {
      fill: #201415;
    }
    .axe-26 {
      fill: #2e201b;
    }
    .axe-27 {
      fill: #473b52;
    }
    .axe-28,
    .axe-29,
    .cat-5,
    .cat-7,
    .cat-8 {
      fill: none;
      stroke-miterlimit: 10;
      stroke-width: 0.14px;
    }
    .axe-28 {
      stroke: #473b52;
    }
    .axe-29 {
      stroke: #4e435b;
    }
    .axe-30 {
      fill: url(#axe-6);
    }
    .axe-31 {
      fill: url(#axe-7);
    }
    .axe-32 {
      fill: url(#axe-8);
    }
    .axe-33 {
      fill: url(#axe-9);
    }
    .axe-34 {
      fill: url(#axe-10);
    }
    .axe-37 {
      fill: url(#axe-11);
    }
    .axe-38 {
      fill: url(#axe-12);
    }
    .axe-39 {
      fill: url(#axe-13);
    }
    .axe-40 {
      fill: url(#axe-14);
    }
    .axe-41 {
      fill: url(#axe-15);
    }
    .axe-42 {
      fill: url(#axe-16);
    }
    .axe-43 {
      fill: url(#axe-17);
    }
    .axe-44 {
      fill: url(#axe-18);
    }
    .axe-45 {
      fill: url(#axe-19);
    }
    .axe-46 {
      fill: url(#axe-20);
    }
    .axe-48 {
      fill: url(#_3-5);
    }
    .axe-49,
    .sword-16,
    .sword-19 {
      fill: url(#_3-6);
    }
    .gun-7 {
      fill: #838383;
    }
    .gun-8 {
      fill: #162048;
    }
    .gun-11 {
      fill: url(#_11);
    }
    .gun-12 {
      fill: url(#_11-2);
    }
    .gun-13 {
      fill: url(#_14);
    }
    .gun-22,
    .sword-22 {
      fill: #99999a;
    }
    .chuck-2 {
      fill: #e2e2e2;
    }
    .chuck-3,
    .pet-21 {
      fill: #4b6d73;
    }
    .chuck-14 {
      fill: #a7a9ac;
    }
    .chuck-15 {
      fill: #e6e7e8;
    }
    .chuck-16,
    .chuck-18,
    .pow-41 {
      opacity: 0.5;
    }
    .chuck-17,
    .chuck-18 {
      fill: #808285;
    }
    .chuck-19 {
      fill: #939598;
    }
    .chuck-20 {
      fill: url(#nun-chuck);
    }
    .chuck-21 {
      fill: url(#nun-chuck-2);
    }
    .chuck-22 {
      fill: url(#nun-chuck-3);
    }
    .chuck-23 {
      fill: url(#nun-chuck-4);
    }
    .pow-6 {
      fill: #797c86;
    }
    .pow-7 {
      fill: url(#pow-wow);
    }
    .pow-8 {
      fill: url(#pow-wow-2);
    }
    .pow-9 {
      fill: url(#pow-wow-3);
    }
    .pow-10 {
      fill: url(#pow-wow-4);
    }
    .pow-11 {
      fill: url(#pow-wow-5);
    }
    .pow-12 {
      fill: url(#pow-wow-6);
    }
    .pow-13 {
      fill: url(#pow-wow-7);
    }
    .pow-14 {
      fill: url(#pow-wow-8);
    }
    .pow-15 {
      fill: url(#pow-wow-9);
    }
    .pow-16 {
      fill: url(#pow-wow-10);
    }
    .pow-17 {
      fill: #373133;
    }
    .pow-18 {
      fill: #a69c9b;
    }
    .pow-19 {
      fill: #636162;
    }
    .pow-21 {
      fill: #7f766c;
    }
    .pow-22 {
      fill: #353537;
    }
    .pow-23 {
      fill: #474745;
    }
    .pow-24 {
      fill: url(#pow-wow-11);
    }
    .pow-25 {
      fill: #434343;
    }
    .pow-26 {
      fill: #141517;
    }
    .pow-27 {
      fill: #2d2d35;
    }
    .pow-28 {
      fill: #212b2d;
    }
    .pow-29 {
      fill: #4a4647;
    }
    .pow-30 {
      fill: #585d71;
    }
    .pow-31 {
      fill: #4d5059;
    }
    .pow-32 {
      fill: url(#pow-wow-12);
    }
    .pow-33 {
      fill: #4c453d;
    }
    .pow-34 {
      fill: #d3cec8;
    }
    .pow-35 {
      fill: #0a0d16;
    }
    .pow-36 {
      fill: #393532;
    }
    .pow-37 {
      fill: #394226;
    }
    .pow-38 {
      fill: #383a4a;
    }
    .pow-39 {
      fill: #cdc36d;
    }
    .pow-40 {
      fill: #5f5e48;
    }
    .pow-42 {
      fill: #3f4329;
    }
    .pow-43 {
      fill: #c3c5db;
    }
    .pow-44 {
      fill: #2c3347;
    }
    .pow-45 {
      fill: #363435;
    }
    .pow-46 {
      fill: #0b0e13;
    }
    .pow-47 {
      fill: #7d7976;
    }
    .pow-48 {
      fill: #877f7c;
    }
    .pow-49 {
      fill: #42475b;
    }
    .pow-50 {
      fill: url(#pow-wow-13);
    }
    .pow-51 {
      fill: url(#pow-wow-14);
    }
    .pow-52 {
      fill: url(#pow-wow-15);
    }
    .shield-3 {
      fill: #3c5a5f;
    }
    .shield-6,
    .sword-21 {
      fill: #d3d3d3;
    }
    .shield-7 {
      fill: url(#_2-4-2);
    }
    .shield-8 {
      fill: url(#_2-4-3);
    }
    .shield-9 {
      fill: url(#_2-4-4);
    }
    .shield-10 {
      fill: url(#_2-4-5);
    }
    .shield-11 {
      fill: url(#_2-4-6);
    }
    .shield-12 {
      fill: url(#_2-4-7);
    }
    .shield-13 {
      fill: url(#_2-4-8);
    }
    .sword-7 {
      fill: url(#_2-3);
    }
    .sword-9 {
      fill: url(#_2-5);
    }
    .sword-10 {
      fill: url(#_2-6);
    }
    .sword-11 {
      fill: #13181d;
    }
    .sword-13 {
      fill: url(#_4-7);
    }
    .sword-14 {
      fill: url(#_4-8);
    }
    .weapon-14 {
      fill: url(#weapon-1);
    }
    .weapon-15 {
      fill: url(#weapon-1-2);
    }
    .weapon-16 {
      fill: url(#weapon-1-3);
    }
    .weapon-17 {
      fill: url(#weapon-2);
    }
    .weapon-18 {
      fill: url(#weapon-2-2);
    }
    .weapon-19 {
      fill: url(#weapon-1-4);
    }
    .weapon-20 {
      fill: url(#weapon-1-5);
    }
    .weapon-21 {
      fill: url(#weapon-1-6);
    }
    .weapon-22 {
      fill: url(#weapon-1-7);
    }
    .weapon-23 {
      fill: url(#weapon-1-8);
    }
    .weapon-24 {
      fill: #646567;
    }
    .weapon-25 {
      fill: url(#weapon-1-9);
    }
    .weapon-26 {
      fill: url(#weapon-1-10);
    }
    .weapon-27 {
      fill: url(#weapon-2-3);
    }
    .weapon-28 {
      fill: url(#weapon-1-11);
    }
    .weapon-29 {
      fill: url(#weapon-2-4);
    }
    .weapon-30 {
      fill: #8f9092;
    }
    .weapon-31 {
      fill: url(#weapon-1-12);
    }
    .weapon-32 {
      fill: url(#weapon-1-13);
    }
    .weapon-33 {
      fill: url(#weapon-1-14);
    }
    .weapon-34 {
      fill: url(#weapon-1-15);
    }
    .weapon-35 {
      fill: url(#weapon-1-16);
    }
    .weapon-36 {
      fill: url(#weapon-1-17);
    }
    .weapon-37 {
      fill: url(#weapon-1-18);
    }
    .weapon-38 {
      fill: url(#weapon-1-19);
    }
    .weapon-39 {
      fill: url(#weapon-1-20);
    }
    .weapon-40 {
      fill: url(#weapon-1-21);
    }
    .weapon-41 {
      fill: url(#weapon-1-22);
    }
    .weapon-42 {
      fill: url(#weapon-1-23);
    }
    .weapon-43 {
      fill: url(#weapon-1-24);
    }
    .weapon-44 {
      fill: url(#weapon-1-25);
    }
    .weapon-45 {
      fill: url(#weapon-1-26);
    }
    .weapon-46 {
      fill: url(#weapon-1-27);
    }
    .weapon-47 {
      fill: url(#weapon-1-28);
    }
    .weapon-48 {
      fill: url(#weapon-1-29);
    }
    .weapon-49 {
      fill: url(#weapon-1-30);
    }
    .weapon-50 {
      fill: url(#weapon-1-31);
    }
    .weapon-51 {
      fill: url(#weapon-1-32);
    }
    .weapon-52 {
      fill: url(#weapon-1-33);
    }
    .weapon-53 {
      fill: url(#weapon-1-34);
    }
    .weapon-54 {
      fill: url(#weapon-1-35);
    }
    .weapon-55 {
      fill: url(#weapon-1-36);
    }
    .weapon-56 {
      fill: url(#weapon-1-37);
    }
    .weapon-57 {
      fill: url(#weapon-1-38);
    }
    .weapon-58 {
      fill: url(#weapon-1-39);
    }
    .weapon-59 {
      fill: url(#weapon-1-40);
    }
    .weapon-60 {
      fill: url(#weapon-1-41);
    }
    .weapon-61 {
      fill: url(#weapon-1-42);
    }
    .weapon-62 {
      fill: url(#weapon-1-43);
    }
    .weapon-63 {
      fill: url(#weapon-1-44);
    }
    .weapon-64 {
      fill: url(#weapon-2-5);
    }
    .weapon-65 {
      fill: url(#weapon-2-6);
    }
    .weapon-66 {
      fill: url(#weapon-2-7);
    }
    .weapon-67 {
      fill: url(#weapon-2-8);
    }
    .weapon-68 {
      fill: url(#weapon-2-9);
    }
    .weapon-69 {
      fill: url(#weapon-1-45);
    }
    .weapon-70 {
      fill: url(#weapon-1-46);
    }
    .weapon-71 {
      fill: url(#weapon-1-47);
    }
    .weapon-72 {
      fill: url(#weapon-1-48);
    }
    .weapon-73 {
      fill: url(#weapon-1-49);
    }
    .weapon-74 {
      fill: url(#weapon-2-10);
    }
    .weapon-75 {
      fill: url(#weapon-1-50);
    }
    .weapon-76 {
      fill: url(#weapon-1-51);
    }
    .weapon-77 {
      fill: url(#weapon-1-52);
    }
    .weapon-78 {
      fill: url(#weapon-1-53);
    }
    .weapon-79 {
      fill: url(#weapon-1-54);
    }
    .weapon-80 {
      fill: url(#weapon-2-11);
    }
    .weapon-81 {
      fill: url(#weapon-1-55);
    }
    .weapon-82 {
      fill: url(#weapon-1-56);
    }
    .weapon-83 {
      fill: url(#weapon-1-57);
    }
    .weapon-84 {
      fill: url(#weapon-1-58);
    }
    .weapon-85 {
      fill: url(#weapon-1-59);
    }
    .weapon-86 {
      fill: url(#weapon-2-12);
    }
    .weapon-87 {
      fill: url(#weapon-1-60);
    }
    .weapon-88 {
      fill: url(#weapon-1-61);
    }
    .weapon-89 {
      fill: url(#weapon-1-62);
    }
    .weapon-90 {
      fill: url(#weapon-1-63);
    }
    .weapon-91 {
      fill: url(#weapon-1-64);
    }
    .weapon-92 {
      fill: url(#weapon-2-13);
    }
    .weapon-93 {
      fill: url(#weapon-2-14);
    }
    .weapon-94 {
      fill: url(#weapon-1-65);
    }
    .weapon-95 {
      fill: url(#weapon-1-66);
    }
    .weapon-96 {
      fill: url(#weapon-1-67);
    }
    .weapon-97 {
      fill: url(#weapon-1-68);
    }
    .weapon-98 {
      fill: url(#weapon-1-69);
    }
    .weapon-99 {
      fill: url(#weapon-2-15);
    }
    .weapon-100 {
      fill: url(#weapon-1-70);
    }
    .weapon-101 {
      fill: url(#weapon-1-71);
    }
    .weapon-102 {
      fill: url(#weapon-1-72);
    }
    .weapon-103 {
      fill: url(#weapon-1-73);
    }
    .weapon-104 {
      fill: url(#weapon-1-74);
    }
    .weapon-105 {
      fill: url(#weapon-2-16);
    }
    .flame-2 {
      fill: url(#flame);
    }
    .flame-7 {
      fill: url(#flame-2);
    }
    .flame-8 {
      fill: url(#flame-3);
    }
    .flame-9 {
      fill: url(#flame-4);
    }
    .flame-14 {
      opacity: 0.58;
      fill: url(#_243);
    }
    .flame-14,
    .flame-15 {
      mix-blend-mode: color-dodge;
    }
    .flame-15 {
      opacity: 0.3;
      fill: url(#_243-2);
    }
    .flowers-11 {
      fill: #7dad57;
    }
    .flowers-12 {
      fill: #6c944c;
    }
    .flowers-13 {
      fill: #ff9e9e;
    }
    .flowers-14 {
      fill: #eb8d8d;
    }
    .flowers-15 {
      fill: #ffb3b3;
    }
    .flowers-16 {
      fill: #f59c9c;
    }
    .flowers-17 {
      fill: #ffc7c7;
    }
    .flowers-18 {
      fill: #b55b62;
    }
    .flowers-19 {
      fill: #9c4e53;
    }
    .flowers-20 {
      fill: #ffd6d6;
    }
    .flowers-21 {
      fill: #ffbdbd;
    }
    .flowers-22 {
      fill: #de7079;
    }
    .flowers-23 {
      fill: #e678e2;
    }
    .flowers-24 {
      fill: #c452c0;
    }
    .flowers-25 {
      fill: #fa9bf7;
    }
    .flowers-26 {
      fill: #eb8de7;
    }
    .flowers-27 {
      fill: #943b91;
    }
    .flowers-28 {
      fill: #752f73;
    }
    .flowers-29 {
      fill: #b849b3;
    }
    .flowers-30 {
      fill: #e67ce0;
    }
    .flowers-31 {
      fill: #5c9e6f;
    }
    .flowers-32 {
      fill: #447351;
    }
    .flowers-33 {
      fill: #ff7575;
    }
    .flowers-34 {
      fill: #d64d4d;
    }
    .flowers-35 {
      fill: #eb5555;
    }
    .flowers-36 {
      fill: #d65a5a;
    }
    .flowers-37 {
      fill: #994141;
    }
    .flowers-38 {
      fill: #d14b4b;
    }
    .flowers-39 {
      fill: #fa6464;
    }
    .flowers-40 {
      fill: #ffc2c2;
    }
    .flowers-41 {
      fill: #e3d7a1;
    }
    .flowers-42 {
      fill: #f8efc4;
    }
    .flowers-43 {
      fill: #e8dfb7;
    }
    .cat-13,
    .pet-26 {
      fill: url(#_160-5);
    }
    .cat-14,
    .pet-28 {
      fill: url(#_160-6);
    }
    .cat-5,
    .cat-8 {
      stroke: #aeaeaf;
    }
    .cat-5 {
      stroke-width: 0.09px;
    }
    .cat-8 {
      stroke-width: 0.1px;
    }
    .cat-9 {
      fill: #243442;
    }
    .cat-10 {
      fill: #aeaeaf;
    }
    .cat-18 {
      fill: #fefefe;
    }
    .pet-2 {
      fill: url(#pet-1);
    }
    .pet-3 {
      fill: url(#pet-2);
    }
    .pet-4 {
      fill: url(#pet-2-2);
    }
    .pet-5 {
      fill: url(#pet-2-3);
    }
    .pet-6 {
      fill: url(#pet-2-4);
    }
    .pet-7 {
      fill: url(#pet-2-5);
    }
    .pet-8 {
      fill: url(#pet-2-6);
    }
    .pet-9 {
      fill: url(#pet-1-2);
    }
    .pet-10 {
      fill: url(#pet-2-7);
    }
    .pet-11 {
      fill: url(#pet-2-8);
    }
    .pet-12 {
      fill: url(#pet-2-9);
    }
    .pet-13 {
      fill: url(#pet-2-10);
    }
    .pet-14 {
      fill: url(#pet-2-11);
    }
    .pet-15 {
      fill: url(#pet-2-12);
    }
    .pet-18 {
      fill: url(#_17);
    }
    .pet-25 {
      fill: url(#_166-2);
    }
    .pet-27 {
      fill: url(#_166-3);
    }
    .pet-29 {
      fill: url(#_166-4);
    }
    .pet-31 {
      fill: url(#_160-7);
    }
    .pet-32 {
      fill: url(#_160-8);
    }
    .pet-33 {
      fill: url(#_17-1);
    }
    .pet-35 {
      fill: url(#_160-9);
    }
    .pet-36 {
      fill: url(#_160-10);
    }
    .pet-37 {
      fill: url(#_17-2);
    }
    .pet-30 {
      fill: #b5b5b5;
    }
  </style>
`;

export const hero_colours = (r = 255, g = 255, b = 255) => html`
  <style>
    .body-2,
    .body-10,
    .body-27,
    .body-5,
    .right-arm-8,
    .right-arm-4,
    .arrow-22,
    .arrow-3,
    .axe-5,
    .axe-3,
    .gun-3,
    .gun-16,
    .chuck-4,
    .chuck-8,
    .pow-4,
    .sword-3,
    .sword-15,
    .weapon-6,
    .weapon-4,
    .left-arm-2,
    .left-arm-5,
    .fight-3,
    .fight-5,
    .flame-3,
    .flowers-3,
    .flowers-5,
    .cat-15 {
      fill: rgb(${r - 80}, ${g - 80}, ${b - 80});
    }

    .body-9,
    .right-arm-2,
    .right-arm-11,
    .arrow-6,
    .arrow-7,
    .axe-7,
    .axe-51,
    .gun-2,
    .chuck-5,
    .pow-1,
    .sword-2,
    .weapon-2,
    .weapon-9,
    .chuck-26,
    .left-arm-7,
    .fight-7,
    .flowers-7,
    .pet-34 {
      fill: rgb(${r - 130}, ${g - 130}, ${b - 130});
    }

    .cat-4,
    .cat-7,
    .pet-17 {
      fill: rgb(${r}, ${g}, ${b});
    }

    .gradient-primary {
      stop-color: rgb(${r}, ${g}, ${b});
    }

    .gradient-stop1 {
      stop-color: rgb(${r - 4}, ${g - 4}, ${b - 4});
    }

    .gradient-stop2 {
      stop-color: rgb(${r - 6}, ${g - 6}, ${b - 6});
    }

    .gradient-stop3 {
      stop-color: rgb(${r - 26}, ${g - 26}, ${b - 26});
    }

    .gradient-stop4 {
      stop-color: rgb(${r - 32}, ${g - 32}, ${b - 32});
    }

    .gradient-stop5 {
      stop-color: rgb(${r - 40}, ${g - 40}, ${b - 40});
    }

    .gradient-stop6 {
      stop-color: rgb(${r - 60}, ${g - 60}, ${b - 60});
    }

    .gradient-alt-stop1 {
      stop-color: rgb(${r - 24}, ${g - 24}, ${b - 24});
    }
  </style>
`;

export const hero_gradients = svg`
  <linearGradient id="_2" x1="166.04" y1="139.7" x2="125.34" y2="132.32" gradientUnits="userSpaceOnUse">
    <stop offset="0" class="gradient-primary"/>
    <stop offset="0.42" class="gradient-stop1"/>
    <stop offset="0.84" class="gradient-stop2"/>
  </linearGradient>
  <linearGradient id="_2-2" x1="-4413.29" y1="11.68" x2="-4447.61" y2="11.4" gradientTransform="matrix(-1, -0.09, -0.09, 1, -4275.95, -196.68)" xlink:href="#_2"/>

  <linearGradient id="_2-4" x1="114.74" y1="330.1" x2="93.15" y2="355.09" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#f2f2f2"/>
      <stop offset="0.42" stop-color="#b5c5c5"/>
      <stop offset="0.84" stop-color="#759595"/>
  </linearGradient>
  <linearGradient id="_2-4-1" x1="199.92" y1="325.76" x2="182.5" y2="347.72" xlink:href="#_2-4"/>
  <linearGradient id="_2-4-2" x1="95.46" y1="223.95" x2="105.17" y2="223.95" gradientTransform="matrix(1, 0, 0, 1, 0, 0)" xlink:href="#_2-4"/>
  <linearGradient id="_2-4-3" x1="97.26" y1="232.91" x2="105.14" y2="232.91" gradientTransform="matrix(1, 0, 0, 1, 0, 0)" xlink:href="#_2-4"/>
  <linearGradient id="_2-4-4" x1="96.36" y1="228.43" x2="105.15" y2="228.43" gradientTransform="matrix(1, 0, 0, 1, 0, 0)" xlink:href="#_2-4"/>
  <linearGradient id="_2-4-5" x1="93.65" y1="215" x2="105.2" y2="215" gradientTransform="matrix(1, 0, 0, 1, 0, 0)" xlink:href="#_2-4"/>
  <linearGradient id="_2-4-6" x1="94.56" y1="219.48" x2="105.18" y2="219.48" gradientTransform="matrix(1, 0, 0, 1, 0, 0)" xlink:href="#_2-4"/>
  <linearGradient id="_2-4-7" x1="123.57" y1="161.71" x2="138.66" y2="161.71" gradientTransform="matrix(1, 0, 0, 1, 0, 0)" xlink:href="#_2-4"/>
  <linearGradient id="_2-4-8" x1="54.36" y1="175.9" x2="73.32" y2="175.9" gradientTransform="matrix(1, 0, 0, 1, 0, 0)" xlink:href="#_2-4"/>

  <linearGradient id="_3" x1="200.16" y1="295.71" x2="152.08" y2="332.06" gradientUnits="userSpaceOnUse">
    <stop offset="0" class="gradient-primary" />
    <stop offset="0.84" class="gradient-alt-stop1" />
  </linearGradient>
  <linearGradient id="_3-2" x1="140.08" y1="299.11" x2="70.09" y2="338.25" xlink:href="#_3"/>
  <linearGradient id="_3-3" x1="146.86" y1="223.71" x2="132.09" y2="269.9" xlink:href="#_3"/>
  <linearGradient id="_3-4" x1="99.12" y1="310.89" x2="123.05" y2="310.89" xlink:href="#_3"/>
  <linearGradient id="_3-5" x1="-39.99" y1="658.58" x2="-46.29" y2="669.87" gradientTransform="matrix(1, -0.1, 0.1, 1, 50.92, -419.23)" xlink:href="#_3"/>
  <linearGradient id="_3-6" x1="-26.7" y1="661.05" x2="-25.95" y2="636.22" gradientTransform="matrix(1, -0.1, 0.1, 1, 50.92, -419.23)" xlink:href="#_3"/>
  <linearGradient id="_3-7" x1="123.57" y1="161.71" x2="138.66" y2="161.71" gradientTransform="matrix(1, 0, 0, 1, 0, 0)" xlink:href="#_3"/>
  <linearGradient id="_3-8" x1="54.36" y1="175.9" x2="73.32" y2="175.9" gradientTransform="matrix(1, 0, 0, 1, 0, 0)" xlink:href="#_3"/>

  <linearGradient id="_4" x1="163.05" y1="212.47" x2="142.68" y2="139" gradientUnits="userSpaceOnUse">
    <stop offset="0.04" class="gradient-primary" />
    <stop offset="0.3" class="gradient-stop1" />
    <stop offset="0.55" class="gradient-stop2" />
    <stop offset="0.7" class="gradient-stop3" />
    <stop offset="0.8" class="gradient-stop4" />
    <stop offset="1" class="gradient-stop5" />
  </linearGradient>
  <linearGradient id="_4-2" x1="165" y1="158.66" x2="144.35" y2="190.23" xlink:href="#_4"/>
  <linearGradient id="_4-3" x1="159.31" y1="106.48" x2="131.29" y2="134.31" xlink:href="#_4"/>
  <linearGradient id="_4-4" x1="142.95" y1="229.17" x2="140.53" y2="265.25" xlink:href="#_4"/>
  <linearGradient id="_4-5" x1="1233.3" y1="-1336.57" x2="1231.5" y2="-1305.57" gradientTransform="translate(227.44 2029.91) rotate(-46.48)" xlink:href="#_4"/>

  <linearGradient id="_11" x1="-3894.09" y1="-4261.08" x2="-3893.2" y2="-4281.78" gradientTransform="matrix(0.89, 0.46, -0.46, 0.89, 1622.07, 5811.99)" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#898577"/>
    <stop offset="0.17" stop-color="#706d62"/>
    <stop offset="0.74" stop-color="#201f1c"/>
    <stop offset="1"/>
  </linearGradient>
  <linearGradient id="_11-2" x1="-3834.37" y1="-4260.18" x2="-3833.05" y2="-4276.51" xlink:href="#_11"/>

  <linearGradient id="_14" x1="-3833.74" y1="-4267.83" x2="-3833.74" y2="-4272.46" gradientTransform="matrix(0.89, 0.46, -0.46, 0.89, 1622.07, 5811.99)" gradientUnits="userSpaceOnUse">
    <stop offset="0.01" stop-color="#22577e"/>
    <stop offset="0.25" stop-color="#204f77"/>
    <stop offset="0.63" stop-color="#1c3b62"/>
    <stop offset="1" stop-color="#162048"/>
  </linearGradient>

  <radialGradient id="_17" cx="207.04" cy="84.61" r="15.8" gradientTransform="matrix(1, 0, 0, 1, 0, 0)" gradientUnits="userSpaceOnUse">
    <stop offset="0.1" class="gradient-primary"/>
    <stop offset="0.35" class="gradient-stop1"/>
    <stop offset="0.73" class="gradient-stop3"/>
    <stop offset="1" class="gradient-stop6"/>
  </radialGradient>
  <radialGradient id="_17-1" cx="47.2" cy="-3560.99" r="7.89" gradientTransform="translate(3742.24 109.88) rotate(-90)" xlink:href="#_17"/>
  <radialGradient id="_17-2" cx="233.3" cy="63.98" r="7.89" gradientTransform="matrix(1, 0, 0, 1, 0, 0)" xlink:href="#_17"/>

  <linearGradient id="_40" x1="184.89" y1="165.08" x2="143.7" y2="209.94" gradientUnits="userSpaceOnUse">
    <stop offset="0.17" stop-color="#bdb48e"/>
    <stop offset="0.26" stop-color="#b3ab87"/>
    <stop offset="0.41" stop-color="#999273"/>
    <stop offset="0.6" stop-color="#6e6953"/>
    <stop offset="0.82" stop-color="#333126"/>
    <stop offset="1"/>
  </linearGradient>
  <linearGradient id="_40-2" x1="167.32" y1="118.95" x2="141.95" y2="147.92" xlink:href="#_40"/>
  <linearGradient id="_40-3" x1="164.13" y1="100.45" x2="140.84" y2="123.93" xlink:href="#_40"/>
  <linearGradient id="_40-4" x1="-4416.71" y1="-2.35" x2="-4442.7" y2="23.64" gradientTransform="matrix(-1, -0.09, -0.09, 1, -4275.95, -196.68)" xlink:href="#_40"/>
  <linearGradient id="_40-5" x1="161.28" y1="221.18" x2="132.89" y2="253.93" xlink:href="#_40"/>

  <radialGradient id="_160" cx="148.49" cy="145.44" r="9.31" gradientUnits="userSpaceOnUse">
      <stop offset="0.01" stop-color="#22577e"/>
      <stop offset="0.25" stop-color="#204f77"/>
      <stop offset="0.63" stop-color="#1c3b62"/>
      <stop offset="1" stop-color="#162048"/>
  </radialGradient>
  <radialGradient id="_160-2" cx="136.32" cy="146.41" r="7.97" xlink:href="#_160"/>
  <radialGradient id="_160-3" cx="161.59" cy="163.33" r="27.61" xlink:href="#_160"/>
  <radialGradient id="_160-4" cx="158.87" cy="105.16" r="31.13" xlink:href="#_160"/>
  <radialGradient id="_160-5" cx="-1843.29" cy="337.32" r="9.49" gradientTransform="matrix(-0.88, 0, 0, 0.87, -1399.37, -0.25)" xlink:href="#_160"/>
  <radialGradient id="_160-6" cx="241.08" cy="289.91" r="8.57" xlink:href="#_160"/>
  <radialGradient id="_160-7" cx="-314.53" cy="-3120.45" r="3.48" gradientTransform="translate(3283.32 483.33) rotate(-76.42)" xlink:href="#_160"/>
  <radialGradient id="_160-8" cx="-310.59" cy="-3125.03" r="3.35" gradientTransform="translate(3283.32 483.33) rotate(-76.42)" xlink:href="#_160"/>

  <linearGradient id="_166" x1="166.69" y1="160.35" x2="149.02" y2="181.49" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#848174"/>
      <stop offset="0.73" stop-color="#252420"/>
      <stop offset="1"/>
  </linearGradient>
  <linearGradient id="_166-2" x1="206.47" y1="82.03" x2="204.91" y2="83.89" xlink:href="#_166"/>
  <linearGradient id="_166-3" x1="198.84" y1="82.09" x2="197.28" y2="83.95" xlink:href="#_166"/>
  <linearGradient id="_166-4" x1="202.64" y1="81.8" x2="201.08" y2="83.66" xlink:href="#_166"/>
  
  <linearGradient id="_190" x1="187.96" y1="275.89" x2="184.84" y2="322.75" gradientUnits="userSpaceOnUse">
      <stop offset="0.17" stop-color="#bdb48e"/>
      <stop offset="0.26" stop-color="#b3ab87"/>
      <stop offset="0.4" stop-color="#999273"/>
      <stop offset="0.59" stop-color="#6e6953"/>
      <stop offset="0.82" stop-color="#333126"/>
      <stop offset="0.99"/>
  </linearGradient>
  <linearGradient id="_190-2" x1="247.42" y1="253.42" x2="209.13" y2="300.65" gradientTransform="matrix(0.97, 0.01, -0.01, 1, -103.76, 29.16)" xlink:href="#_190"/>

  <linearGradient id="axe" x1="-4486.26" y1="111.18" x2="-4444.65" y2="111.18" gradientTransform="matrix(-1, 0, 0, 1, -4244.35, 0)" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#524a5c"/>
      <stop offset="0.08" stop-color="#574f61"/>
      <stop offset="0.19" stop-color="#645f6f"/>
      <stop offset="0.31" stop-color="#797987"/>
      <stop offset="0.4" stop-color="#8d919d"/>
      <stop offset="0.97" stop-color="#b1b2af"/>
  </linearGradient>
  <linearGradient id="axe-2" x1="-4506.66" y1="101.87" x2="-4476.48" y2="101.87" gradientTransform="matrix(-1, 0, 0, 1, -4244.35, 0)" gradientUnits="userSpaceOnUse">
      <stop offset="0.08" stop-color="#aeafad"/>
      <stop offset="0.91" stop-color="#524a5c"/>
  </linearGradient>
  <linearGradient id="axe-3" x1="-4449.72" y1="120.07" x2="-4432.32" y2="104.59" xlink:href="#axe"/>
  <linearGradient id="axe-4" x1="-4451.73" y1="81.01" x2="-4431.23" y2="81.01" xlink:href="#axe"/>
  <linearGradient id="axe-5" x1="-4466.67" y1="142.89" x2="-4455.39" y2="142.89" gradientTransform="matrix(-1, 0, 0, 1, -4244.35, 0)" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#2d1d31"/>
      <stop offset="0.23" stop-color="#2f2036"/>
      <stop offset="0.5" stop-color="#352844"/>
      <stop offset="0.97" stop-color="#2c1d31"/>
  </linearGradient>
  <linearGradient id="axe-6" x1="-4479.02" y1="103.42" x2="-4463.66" y2="103.42" xlink:href="#axe"/>
  <linearGradient id="axe-7" x1="-4458.95" y1="101.66" x2="-4447.86" y2="101.66" xlink:href="#axe"/>
  <linearGradient id="axe-8" x1="-4483.3" y1="96.03" x2="-4461.39" y2="96.03" xlink:href="#axe"/>
  <linearGradient id="axe-9" x1="-4461.39" y1="89.77" x2="-4447.86" y2="89.77" xlink:href="#axe"/>
  <linearGradient id="axe-10" x1="-4463.74" y1="97.53" x2="-4459.06" y2="97.53" xlink:href="#axe-2"/>
  <linearGradient id="axe-11" x1="-4191.94" y1="-3069.33" x2="-4150.34" y2="-3069.33" gradientTransform="matrix(-0.24, -0.97, -0.97, 0.24, -3854.45, -3063.19)" xlink:href="#axe"/>
  <linearGradient id="axe-12" x1="-4212.35" y1="-3078.64" x2="-4182.17" y2="-3078.64" gradientTransform="matrix(-0.24, -0.97, -0.97, 0.24, -3854.45, -3063.19)" xlink:href="#axe-2"/>
  <linearGradient id="axe-13" x1="-4155.41" y1="-3060.44" x2="-4138.01" y2="-3075.92" gradientTransform="matrix(-0.24, -0.97, -0.97, 0.24, -3854.45, -3063.19)" xlink:href="#axe"/>
  <linearGradient id="axe-14" x1="-4157.42" y1="-3099.51" x2="-4136.91" y2="-3099.51" gradientTransform="matrix(-0.24, -0.97, -0.97, 0.24, -3854.45, -3063.19)" xlink:href="#axe"/>
  <linearGradient id="axe-15" x1="-4172.36" y1="-3037.62" x2="-4161.08" y2="-3037.62" gradientTransform="matrix(-0.24, -0.97, -0.97, 0.24, -3854.45, -3063.19)" xlink:href="#axe-5"/>
  <linearGradient id="axe-16" x1="-4184.71" y1="-3077.09" x2="-4169.35" y2="-3077.09" gradientTransform="matrix(-0.24, -0.97, -0.97, 0.24, -3854.45, -3063.19)" xlink:href="#axe"/>
  <linearGradient id="axe-17" x1="-4164.64" y1="-3078.85" x2="-4153.55" y2="-3078.85" gradientTransform="matrix(-0.24, -0.97, -0.97, 0.24, -3854.45, -3063.19)" xlink:href="#axe"/>
  <linearGradient id="axe-18" x1="-4188.98" y1="-3084.48" x2="-4167.08" y2="-3084.48" gradientTransform="matrix(-0.24, -0.97, -0.97, 0.24, -3854.45, -3063.19)" xlink:href="#axe"/>
  <linearGradient id="axe-19" x1="-4167.08" y1="-3090.74" x2="-4153.55" y2="-3090.74" gradientTransform="matrix(-0.24, -0.97, -0.97, 0.24, -3854.45, -3063.19)" xlink:href="#axe"/>
  <linearGradient id="axe-20" x1="-4169.43" y1="-3082.99" x2="-4164.75" y2="-3082.99" gradientTransform="matrix(0, -1, -1, 0, -2935, -3936.35)" xlink:href="#axe-2"/>
  <linearGradient id="nun-chuck" x1="1380.6" y1="1164.87" x2="1390.28" y2="1156.13" gradientTransform="translate(558.19 -1607.39) rotate(65.39)" gradientUnits="userSpaceOnUse">
    <stop offset="0.02" stop-color="#020204"/>
    <stop offset="0.27" stop-color="#5c5e5d"/>
    <stop offset="0.36" stop-color="#989a9a"/>
    <stop offset="0.47" stop-color="#eeeff1"/>
    <stop offset="0.58" stop-color="#767779"/>
    <stop offset="0.61" stop-color="#5b5c5e"/>
    <stop offset="0.83" stop-color="#202122"/>
  </linearGradient>
  <linearGradient id="nun-chuck-2" x1="1417.73" y1="1178.09" x2="1387.08" y2="1204.13" gradientTransform="translate(558.19 -1607.39) rotate(65.39)" gradientUnits="userSpaceOnUse">
    <stop offset="0.22" stop-color="#5c5e5d"/>
    <stop offset="0.24" stop-color="#212122"/>
    <stop offset="0.24" stop-color="#020204"/>
    <stop offset="0.33" stop-color="#9b9c9d"/>
    <stop offset="0.38" stop-color="#8c8c8c"/>
    <stop offset="0.44" stop-color="#202122"/>
  </linearGradient>
  <linearGradient id="nun-chuck-3" x1="123.15" y1="137.4" x2="132.84" y2="128.66" gradientTransform="matrix(1, 0, 0, 1, 0, 0)" xlink:href="#nun-chuck"/>
  <linearGradient id="nun-chuck-4" x1="160.28" y1="150.62" x2="129.63" y2="176.66" gradientTransform="matrix(1, 0, 0, 1, 0, 0)" xlink:href="#nun-chuck-2"/>
  <linearGradient id="pow-wow" x1="-241.76" y1="730.82" x2="-242.89" y2="725.53" gradientTransform="translate(852.18 514) rotate(85.91)" gradientUnits="userSpaceOnUse">
    <stop offset="0.06" stop-color="#fff"/>
    <stop offset="0.28" stop-color="#929497"/>
    <stop offset="0.51" stop-color="#d0d2d3"/>
    <stop offset="0.66" stop-color="#797c86"/>
    <stop offset="0.82" stop-color="#fff"/>
    <stop offset="1" stop-color="#797c86"/>
  </linearGradient>
  <linearGradient id="pow-wow-2" x1="-218.67" y1="982.51" x2="-220.51" y2="973.84" gradientTransform="matrix(0.03, 1.01, -0.88, 0.03, 990.05, 467.41)" xlink:href="#pow-wow"/>
  <linearGradient id="pow-wow-3" x1="-233.28" y1="990.15" x2="-235.13" y2="981.48" gradientTransform="matrix(0.03, 1.01, -0.88, 0.03, 990.05, 467.41)" xlink:href="#pow-wow"/>
  <linearGradient id="pow-wow-4" x1="-211.19" y1="731.47" x2="-213.11" y2="722.42" gradientTransform="translate(831.28 467.91) rotate(88.13)" xlink:href="#pow-wow"/>
  <linearGradient id="pow-wow-5" x1="-287.88" y1="733.02" x2="-289.72" y2="724.35" xlink:href="#pow-wow"/>
  <linearGradient id="pow-wow-6" x1="-247.88" y1="716.61" x2="-249" y2="711.33" xlink:href="#pow-wow"/>
  <linearGradient id="pow-wow-7" x1="-248.01" y1="707.46" x2="-249.15" y2="702.11" xlink:href="#pow-wow"/>
  <linearGradient id="pow-wow-8" x1="-292.8" y1="718.91" x2="-294.64" y2="710.25" xlink:href="#pow-wow"/>
  <linearGradient id="pow-wow-9" x1="-292.36" y1="727.97" x2="-294.2" y2="719.3" xlink:href="#pow-wow"/>
  <linearGradient id="pow-wow-10" x1="-273.23" y1="738.07" x2="-275.15" y2="729.01" gradientTransform="translate(847.65 504.51) rotate(86.36)" xlink:href="#pow-wow"/>
  <linearGradient id="pow-wow-11" x1="-338.12" y1="731.9" x2="-338.12" y2="718.44" xlink:href="#pow-wow"/>
  <linearGradient id="pow-wow-12" x1="-422.94" y1="756.02" x2="-422.94" y2="764.42" xlink:href="#pow-wow"/>
  <linearGradient id="pow-wow-13" x1="-242.92" y1="721.85" x2="-244.07" y2="716.46" xlink:href="#pow-wow"/>
  <linearGradient id="pow-wow-14" x1="-345.25" y1="709.96" x2="-346.4" y2="704.58" gradientTransform="translate(872.13 578.08) rotate(83.11)" xlink:href="#pow-wow"/>
  <linearGradient id="pow-wow-15" x1="-244.2" y1="728.68" x2="-245.32" y2="723.4" xlink:href="#pow-wow"/>
  <linearGradient id="weapon-1" x1="283.92" y1="1483.21" x2="282.99" y2="1484.13" gradientTransform="translate(973.35 -1060.57) rotate(42.8)" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#767779"/>
    <stop offset="1" stop-color="#262626"/>
  </linearGradient>
  <linearGradient id="weapon-1-2" x1="262.38" y1="1511.98" x2="265.72" y2="1514.06" gradientTransform="translate(973.35 -1060.57) rotate(42.8)" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#8f9092"/>
    <stop offset="1" stop-color="#424242"/>
  </linearGradient>
  <linearGradient id="weapon-1-3" x1="265.45" y1="1515" x2="263.13" y2="1513.74" gradientTransform="translate(973.35 -1060.57) rotate(42.8)" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#797a7c"/>
    <stop offset="1" stop-color="#454443"/>
  </linearGradient>
  <radialGradient id="weapon-2" cx="438.82" cy="1608.32" r="11.11" gradientTransform="translate(880.17 -1223.57) rotate(42.8) scale(0.98)" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#fff"/>
    <stop offset="1" stop-color="#a1a4a5"/>
  </radialGradient>
  <radialGradient id="weapon-2-2" cx="456.26" cy="1579.29" r="11.11" xlink:href="#weapon-2"/>
  <linearGradient id="weapon-1-4" x1="265.92" y1="1514.65" x2="263.93" y2="1513.58" gradientTransform="translate(973.35 -1060.57) rotate(42.8)" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#8f9092"/>
    <stop offset="1" stop-color="#2e2e2e"/>
  </linearGradient>
  <linearGradient id="weapon-1-5" x1="232.12" y1="1558.59" x2="237.56" y2="1561.7" gradientTransform="translate(973.35 -1060.57) rotate(42.8)" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#7b4f3a"/>
    <stop offset="1" stop-color="#472a1e"/>
  </linearGradient>
  <linearGradient id="weapon-1-6" x1="232.54" y1="1558.85" x2="237.38" y2="1561.61" gradientTransform="translate(973.35 -1060.57) rotate(42.8)" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#9d664d"/>
    <stop offset="1" stop-color="#693f2e"/>
  </linearGradient>
  <linearGradient id="weapon-1-7" x1="277.84" y1="1481.79" x2="282.69" y2="1484.56" gradientTransform="translate(918.48 -1015.82) rotate(44.14)" xlink:href="#weapon-1-5"/>
  <linearGradient id="weapon-1-8" x1="225.41" y1="1580.29" x2="226.94" y2="1576.24" gradientTransform="translate(973.35 -1060.57) rotate(42.8)" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#a3a3a3"/>
    <stop offset="1" stop-color="#646567"/>
  </linearGradient>
  <linearGradient id="weapon-1-9" x1="222.93" y1="1577.47" x2="224.83" y2="1579.26" xlink:href="#weapon-1-8"/>
  <linearGradient id="weapon-1-10" x1="225.86" y1="1580.87" x2="225.57" y2="1580.35" gradientTransform="translate(973.35 -1060.57) rotate(42.8)" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#cfcfcf"/>
    <stop offset="1" stop-color="#646567"/>
  </linearGradient>
  <radialGradient id="weapon-2-3" cx="412.66" cy="1657.65" r="3.12" gradientTransform="translate(880.17 -1223.57) rotate(42.8) scale(0.98)" xlink:href="#weapon-1-8"/>
  <linearGradient id="weapon-1-11" x1="-7797.04" y1="-3050.9" x2="-7795.74" y2="-3054.35" gradientTransform="translate(-3540.32 -7298.33) rotate(-137.2)" xlink:href="#weapon-1-8"/>
  <radialGradient id="weapon-2-4" cx="-7982.92" cy="-3135.25" r="3.68" gradientTransform="translate(-3565.32 -7364.92) rotate(-137.2) scale(0.98)" xlink:href="#weapon-1-8"/>
  <linearGradient id="weapon-1-12" x1="861.61" y1="1246.31" x2="861.61" y2="1242.72" gradientTransform="matrix(0.66, 0.76, -0.76, 0.66, 547.83, -1262.52)" xlink:href="#weapon-1-2"/>
  <linearGradient id="weapon-1-13" x1="861.79" y1="1250.37" x2="861.79" y2="1247.46" gradientTransform="matrix(0.66, 0.76, -0.76, 0.66, 547.83, -1262.52)" xlink:href="#weapon-1-2"/>
  <linearGradient id="weapon-1-14" x1="861.56" y1="1246.75" x2="861.46" y2="1245" gradientTransform="matrix(0.66, 0.76, -0.76, 0.66, 547.83, -1262.52)" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#8f9092"/>
    <stop offset="1" stop-color="#e1e2e8"/>
  </linearGradient>
  <linearGradient id="weapon-1-15" x1="863.91" y1="1248.46" x2="863.91" y2="1250.12" xlink:href="#weapon-1-14"/>
  <linearGradient id="weapon-1-16" x1="-1038.13" y1="-4470.14" x2="-1034.77" y2="-4474.73" gradientTransform="translate(-3770.14 -2146.7) rotate(133.88)" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#fff"/>
    <stop offset="1" stop-color="#424242"/>
  </linearGradient>
  <linearGradient id="weapon-1-17" x1="1088.25" y1="-2235.88" x2="1088.25" y2="-2239.47" gradientTransform="matrix(-0.1, 1, -1, -0.1, -1935.48, -1100.98)" xlink:href="#weapon-1-2"/>
  <linearGradient id="weapon-1-18" x1="1088.43" y1="-2231.83" x2="1088.43" y2="-2234.73" gradientTransform="matrix(-0.1, 1, -1, -0.1, -1935.48, -1100.98)" xlink:href="#weapon-1-2"/>
  <linearGradient id="weapon-1-19" x1="1088.2" y1="-2235.44" x2="1088.1" y2="-2237.2" gradientTransform="matrix(-0.1, 1, -1, -0.1, -1935.48, -1100.98)" xlink:href="#weapon-1-14"/>
  <linearGradient id="weapon-1-20" x1="1090.55" y1="-2233.74" x2="1090.55" y2="-2232.08" gradientTransform="matrix(-0.1, 1, -1, -0.1, -1935.48, -1100.98)" xlink:href="#weapon-1-14"/>
  <linearGradient id="weapon-1-21" x1="-4485" y1="-5009.78" x2="-4481.64" y2="-5014.37" gradientTransform="matrix(-1, -0.01, 0.01, -1, -4258.34, -4845.31)" xlink:href="#weapon-1-16"/>
  <linearGradient id="weapon-1-22" x1="-7929.17" y1="-2278.58" x2="-7929.17" y2="-2282.17" gradientTransform="matrix(-0.44, -0.73, 0.73, -0.44, -1623.46, -6537.24)" xlink:href="#weapon-1-2"/>
  <linearGradient id="weapon-1-23" x1="-7928.99" y1="-2274.52" x2="-7928.99" y2="-2277.43" gradientTransform="matrix(-0.44, -0.73, 0.73, -0.44, -1623.46, -6537.24)" xlink:href="#weapon-1-2"/>
  <linearGradient id="weapon-1-24" x1="-7929.22" y1="-2278.14" x2="-7929.32" y2="-2279.89" gradientTransform="matrix(-0.44, -0.73, 0.73, -0.44, -1623.46, -6537.24)" xlink:href="#weapon-1-14"/>
  <linearGradient id="weapon-1-25" x1="-7926.87" y1="-2276.44" x2="-7926.87" y2="-2274.77" gradientTransform="matrix(-0.44, -0.73, 0.73, -0.44, -1623.46, -6537.24)" xlink:href="#weapon-1-14"/>
  <linearGradient id="weapon-1-26" x1="-5340.1" y1="3964.02" x2="-5336.73" y2="3959.44" gradientTransform="matrix(0.68, -0.5, 0.5, 0.69, 1856.84, -5166.11)" xlink:href="#weapon-1-16"/>
  <linearGradient id="weapon-1-27" x1="-3010.92" y1="-5907.78" x2="-3010.92" y2="-5910.81" gradientTransform="matrix(-0.68, 0.17, -0.2, -0.82, -3046.22, -4161.05)" xlink:href="#weapon-1-2"/>
  <linearGradient id="weapon-1-28" x1="-3010.76" y1="-5904.37" x2="-3010.76" y2="-5906.82" gradientTransform="matrix(-0.68, 0.17, -0.2, -0.82, -3046.22, -4161.05)" xlink:href="#weapon-1-2"/>
  <linearGradient id="weapon-1-29" x1="-3010.96" y1="-5907.41" x2="-3011.04" y2="-5908.89" gradientTransform="matrix(-0.68, 0.17, -0.2, -0.82, -3046.22, -4161.05)" xlink:href="#weapon-1-14"/>
  <linearGradient id="weapon-1-30" x1="-3008.98" y1="-5905.98" x2="-3008.98" y2="-5904.58" gradientTransform="matrix(-0.68, 0.17, -0.2, -0.82, -3046.22, -4161.05)" xlink:href="#weapon-1-14"/>
  <linearGradient id="weapon-1-31" x1="-8511.88" y1="-1259.36" x2="-8509.05" y2="-1263.22" gradientTransform="matrix(-0.26, -0.81, 0.66, -0.24, -1205.95, -6955.28)" xlink:href="#weapon-1-16"/>
  <linearGradient id="weapon-1-32" x1="-5765.47" y1="3118.64" x2="-5765.47" y2="3115.92" gradientTransform="matrix(0.61, -0.8, 0.79, 0.61, 1188.04, -6251.34)" xlink:href="#weapon-1-2"/>
  <linearGradient id="weapon-1-33" x1="-5765.34" y1="3121.72" x2="-5765.34" y2="3119.51" gradientTransform="matrix(0.61, -0.8, 0.79, 0.61, 1188.04, -6251.34)" xlink:href="#weapon-1-2"/>
  <linearGradient id="weapon-1-34" x1="-5765.51" y1="3118.98" x2="-5765.59" y2="3117.65" gradientTransform="matrix(0.61, -0.8, 0.79, 0.61, 1188.04, -6251.34)" xlink:href="#weapon-1-14"/>
  <linearGradient id="weapon-1-35" x1="-5763.73" y1="3120.27" x2="-5763.73" y2="3121.53" gradientTransform="matrix(0.61, -0.8, 0.79, 0.61, 1188.04, -6251.34)" xlink:href="#weapon-1-14"/>
  <linearGradient id="weapon-1-36" x1="231.93" y1="2299.81" x2="234.48" y2="2296.33" gradientTransform="matrix(0.85, 0.53, -0.53, 0.85, 1199.46, -1843.89)" xlink:href="#weapon-1-16"/>
  <linearGradient id="weapon-1-37" x1="-5439.72" y1="-4264.78" x2="-5439.72" y2="-4267.51" gradientTransform="matrix(-0.97, -0.23, 0.23, -0.97, -4133.09, -5165.01)" xlink:href="#weapon-1-2"/>
  <linearGradient id="weapon-1-38" x1="-5439.59" y1="-4261.71" x2="-5439.59" y2="-4263.91" gradientTransform="matrix(-0.97, -0.23, 0.23, -0.97, -4133.09, -5165.01)" xlink:href="#weapon-1-2"/>
  <linearGradient id="weapon-1-39" x1="-5439.76" y1="-4264.45" x2="-5439.84" y2="-4265.78" gradientTransform="matrix(-0.97, -0.23, 0.23, -0.97, -4133.09, -5165.01)" xlink:href="#weapon-1-14"/>
  <linearGradient id="weapon-1-40" x1="-5437.98" y1="-4263.16" x2="-5437.98" y2="-4261.9" gradientTransform="matrix(-0.97, -0.23, 0.23, -0.97, -4133.09, -5165.01)" xlink:href="#weapon-1-14"/>
  <linearGradient id="weapon-1-41" x1="-7092.14" y1="1307.32" x2="-7089.59" y2="1303.84" gradientTransform="matrix(0.14, -0.99, 0.99, 0.14, -120.19, -6984.04)" xlink:href="#weapon-1-16"/>
  <linearGradient id="weapon-1-42" x1="-1041.21" y1="-4495.23" x2="-1039.45" y2="-4491.79" gradientTransform="translate(-3770.14 -2146.7) rotate(133.88)" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#c2c3c7"/>
    <stop offset="1" stop-color="#8f9092"/>
  </linearGradient>
  <linearGradient id="weapon-1-43" x1="-1031.66" y1="-4480.48" x2="-1049.67" y2="-4500.21" gradientTransform="translate(-3770.14 -2146.7) rotate(133.88)" xlink:href="#weapon-1-2"/>
  <linearGradient id="weapon-1-44" x1="-1031.98" y1="-4480.83" x2="-1048.74" y2="-4499.2" gradientTransform="translate(-3770.14 -2146.7) rotate(133.88)" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#8f9092"/>
    <stop offset="1" stop-color="#303030"/>
  </linearGradient>
  <radialGradient id="weapon-2-5" cx="2182.04" cy="-5154.19" r="8.75" gradientTransform="matrix(-0.25, 0.6, -0.6, -0.25, -2370.84, -2396.9)" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#e6e7e8"/>
    <stop offset="1" stop-color="#8f9092"/>
  </radialGradient>
  <radialGradient id="weapon-2-6" cx="5787.83" cy="-8220.52" r="8.75" gradientTransform="matrix(-0.15, 0.36, -0.36, -0.15, -1893.62, -3109.9)" xlink:href="#weapon-2-5"/>
  <radialGradient id="weapon-2-7" cx="-949.85" cy="-4722.24" r="0.68" gradientTransform="matrix(-0.68, 0.71, -0.71, -0.68, -3789.93, -2320.57)" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#fff"/>
    <stop offset="1" stop-color="#c7c9ca"/>
  </radialGradient>
  <radialGradient id="weapon-2-8" cx="-947.63" cy="-4723.76" r="0.27" xlink:href="#weapon-2-7"/>
  <radialGradient id="weapon-2-9" cx="-940.96" cy="-4724.5" r="0.23" xlink:href="#weapon-2-7"/>
  <linearGradient id="weapon-1-45" x1="-1045.46" y1="-4479.8" x2="-1045.46" y2="-4482.64" gradientTransform="translate(-3770.14 -2146.7) rotate(133.88)" xlink:href="#weapon-1"/>
  <linearGradient id="weapon-1-46" x1="-1050.03" y1="-4484.63" x2="-1050.03" y2="-4488.23" gradientTransform="translate(-3770.14 -2146.7) rotate(133.88)" xlink:href="#weapon-1-2"/>
  <linearGradient id="weapon-1-47" x1="-1049.85" y1="-4480.58" x2="-1049.85" y2="-4483.49" gradientTransform="translate(-3770.14 -2146.7) rotate(133.88)" xlink:href="#weapon-1-2"/>
  <linearGradient id="weapon-1-48" x1="-1050.08" y1="-4484.2" x2="-1050.18" y2="-4485.95" gradientTransform="translate(-3770.14 -2146.7) rotate(133.88)" xlink:href="#weapon-1-14"/>
  <linearGradient id="weapon-1-49" x1="-1047.73" y1="-4482.49" x2="-1047.73" y2="-4480.83" gradientTransform="translate(-3770.14 -2146.7) rotate(133.88)" xlink:href="#weapon-1-14"/>
  <radialGradient id="weapon-2-10" cx="-956.71" cy="-4715.85" r="1.39" xlink:href="#weapon-2-7"/>
  <linearGradient id="weapon-1-50" x1="-1059.93" y1="-4141.02" x2="-1059.93" y2="-4143.87" gradientTransform="matrix(-0.68, 1.3, -0.78, -0.41, -3780.99, -94.05)" xlink:href="#weapon-1"/>
  <linearGradient id="weapon-1-51" x1="-1004.28" y1="-4471.81" x2="-1007.03" y2="-4474.45" gradientTransform="matrix(-0.69, 0.72, -0.72, -0.69, -3758.08, -2129.46)" xlink:href="#weapon-1-2"/>
  <linearGradient id="weapon-1-52" x1="-1007.22" y1="-4474.58" x2="-1007.98" y2="-4476.73" gradientTransform="matrix(-0.69, 0.72, -0.72, -0.69, -3758.08, -2129.46)" xlink:href="#weapon-1-2"/>
  <linearGradient id="weapon-1-53" x1="-1006.07" y1="-4473.09" x2="-1004.98" y2="-4471.48" gradientTransform="matrix(-0.69, 0.72, -0.72, -0.69, -3758.08, -2129.46)" xlink:href="#weapon-1-14"/>
  <linearGradient id="weapon-1-54" x1="-1007.21" y1="-4473.8" x2="-1007.32" y2="-4475.8" gradientTransform="matrix(-0.69, 0.72, -0.72, -0.69, -3758.08, -2129.46)" xlink:href="#weapon-1-14"/>
  <radialGradient id="weapon-2-11" cx="-915.89" cy="-4704.77" r="0.85" gradientTransform="matrix(-0.67, 0.71, -0.71, -0.67, -3780.21, -2302.38)" xlink:href="#weapon-2-7"/>
  <linearGradient id="weapon-1-55" x1="-3404.53" y1="-5752.31" x2="-3404.53" y2="-5755.13" gradientTransform="matrix(1.41, -0.39, -0.24, -0.85, 3626.41, -6015.42)" xlink:href="#weapon-1"/>
  <linearGradient id="weapon-1-56" x1="-4698.11" y1="-4890.13" x2="-4700.93" y2="-4892.83" gradientTransform="matrix(0.85, -0.52, -0.52, -0.85, 1629.35, -6414.19)" xlink:href="#weapon-1-2"/>
  <linearGradient id="weapon-1-57" x1="-4700.6" y1="-4892.36" x2="-4701.69" y2="-4895.44" gradientTransform="matrix(0.85, -0.52, -0.52, -0.85, 1629.35, -6414.19)" xlink:href="#weapon-1-2"/>
  <linearGradient id="weapon-1-58" x1="-4699.62" y1="-4891.26" x2="-4698.78" y2="-4890.03" gradientTransform="matrix(0.85, -0.52, -0.52, -0.85, 1629.35, -6414.19)" xlink:href="#weapon-1-14"/>
  <linearGradient id="weapon-1-59" x1="-4700.76" y1="-4892.25" x2="-4700.84" y2="-4893.68" gradientTransform="matrix(0.85, -0.52, -0.52, -0.85, 1629.35, -6414.19)" xlink:href="#weapon-1-14"/>
  <radialGradient id="weapon-2-12" cx="-4746.21" cy="-5130.89" r="0.79" gradientTransform="matrix(0.83, -0.51, -0.51, -0.83, 1516.61, -6501.5)" xlink:href="#weapon-2-7"/>
  <linearGradient id="weapon-1-60" x1="-6133.13" y1="700.68" x2="-6133.13" y2="697.86" gradientTransform="matrix(0.11, -1.46, 0.88, 0.07, 230.91, -8798.78)" xlink:href="#weapon-1"/>
  <linearGradient id="weapon-1-61" x1="-6975.69" y1="1687.44" x2="-6978.51" y2="1684.74" gradientTransform="matrix(0.35, -0.94, 0.94, 0.35, 1014.36, -6920.1)" xlink:href="#weapon-1-2"/>
  <linearGradient id="weapon-1-62" x1="-6978.18" y1="1685.2" x2="-6979.28" y2="1682.13" gradientTransform="matrix(0.35, -0.94, 0.94, 0.35, 1014.36, -6920.1)" xlink:href="#weapon-1-2"/>
  <linearGradient id="weapon-1-63" x1="-6977.2" y1="1686.31" x2="-6976.37" y2="1687.53" gradientTransform="matrix(0.35, -0.94, 0.94, 0.35, 1014.36, -6920.1)" xlink:href="#weapon-1-14"/>
  <linearGradient id="weapon-1-64" x1="-6978.34" y1="1685.32" x2="-6978.42" y2="1683.89" gradientTransform="matrix(0.35, -0.94, 0.94, 0.35, 1014.36, -6920.1)" xlink:href="#weapon-1-14"/>
  <radialGradient id="weapon-2-13" cx="-7154.68" cy="1827.16" r="0.79" gradientTransform="matrix(0.34, -0.92, 0.92, 0.34, 925.8, -6986.14)" xlink:href="#weapon-2-7"/>
  <radialGradient id="weapon-2-14" cx="-951.12" cy="-4728.46" r="0.85" xlink:href="#weapon-2-7"/>
  <linearGradient id="weapon-1-65" x1="-5667.74" y1="-5137.67" x2="-5667.74" y2="-5140.52" gradientTransform="matrix(-0.84, -0.17, 0.17, -0.84, -3725.95, -5090.1)" xlink:href="#weapon-1"/>
  <linearGradient id="weapon-1-66" x1="-576.1" y1="3663.36" x2="-576.1" y2="3659.85" gradientTransform="matrix(0.89, 0.25, -0.24, 0.84, 1553.14, -2723.45)" xlink:href="#weapon-1-2"/>
  <linearGradient id="weapon-1-67" x1="-575.93" y1="3667.32" x2="-575.93" y2="3664.48" gradientTransform="matrix(0.89, 0.25, -0.24, 0.84, 1553.14, -2723.45)" xlink:href="#weapon-1-2"/>
  <linearGradient id="weapon-1-68" x1="-576.15" y1="3663.79" x2="-576.25" y2="3662.08" gradientTransform="matrix(0.89, 0.25, -0.24, 0.84, 1553.14, -2723.45)" xlink:href="#weapon-1-14"/>
  <linearGradient id="weapon-1-69" x1="-573.86" y1="3665.46" x2="-573.86" y2="3667.08" gradientTransform="matrix(0.89, 0.25, -0.24, 0.84, 1553.14, -2723.45)" xlink:href="#weapon-1-14"/>
  <radialGradient id="weapon-2-15" cx="-938.93" cy="-4705.31" r="0.85" xlink:href="#weapon-2-7"/>
  <linearGradient id="weapon-1-70" x1="1573.69" y1="-938.5" x2="1573.69" y2="-940.79" gradientTransform="matrix(0.15, 0.85, -0.85, 0.15, -857.4, -961.22)" xlink:href="#weapon-1"/>
  <linearGradient id="weapon-1-71" x1="-7621.77" y1="86.15" x2="-7621.77" y2="83.33" gradientTransform="matrix(-0.1, -0.92, 0.87, -0.09, -618.2, -6742.68)" xlink:href="#weapon-1-2"/>
  <linearGradient id="weapon-1-72" x1="-7621.63" y1="89.33" x2="-7621.63" y2="87.05" gradientTransform="matrix(-0.1, -0.92, 0.87, -0.09, -618.2, -6742.68)" xlink:href="#weapon-1-2"/>
  <linearGradient id="weapon-1-73" x1="-7621.8" y1="86.5" x2="-7621.88" y2="85.12" gradientTransform="matrix(-0.1, -0.92, 0.87, -0.09, -618.2, -6742.68)" xlink:href="#weapon-1-14"/>
  <linearGradient id="weapon-1-74" x1="-7619.96" y1="87.83" x2="-7619.96" y2="89.14" gradientTransform="matrix(-0.1, -0.92, 0.87, -0.09, -618.2, -6742.68)" xlink:href="#weapon-1-14"/>
  <radialGradient id="weapon-2-16" cx="94.27" cy="3758.01" r="0.85" gradientTransform="matrix(0.73, 0.3, -0.3, 0.73, 1227.56, -2542.21)" xlink:href="#weapon-2-7"/>
  <linearGradient id="flame" x1="855.44" y1="-849.91" x2="855.44" y2="-858.14" gradientTransform="matrix(-0.85, -0.87, -0.87, 1.74, 229.71, 2313.99)" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#f16522"/>
    <stop offset="0.23" stop-color="#f37025"/>
    <stop offset="0.64" stop-color="#f47d28"/>
    <stop offset="1" stop-color="#f58229"/>
  </linearGradient>
  <linearGradient id="flame-2" x1="228.42" y1="164.92" x2="228.42" y2="63.83" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#ee4036"/>
    <stop offset="0.41" stop-color="#ef4e2e"/>
    <stop offset="1" stop-color="#f05a28"/>
  </linearGradient>
  <linearGradient id="flame-3" x1="224.22" y1="164.92" x2="224.22" y2="109.02" gradientTransform="matrix(1, 0, 0, 1, 0, 0)" xlink:href="#flame"/>
  <linearGradient id="flame-4" x1="222.04" y1="164.92" x2="222.04" y2="131.77" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#fff100"/>
    <stop offset="0.21" stop-color="#fbca0f"/>
    <stop offset="0.43" stop-color="#f9aa1a"/>
    <stop offset="0.63" stop-color="#f79422"/>
    <stop offset="0.83" stop-color="#f58727"/>
    <stop offset="1" stop-color="#f58229"/>
  </linearGradient>
  <linearGradient id="_243" x1="1177.34" y1="-3834.7" x2="1177.34" y2="-3891.02" gradientTransform="matrix(0.91, 0.42, 0.42, -0.91, 770.4, -3804.18)" gradientUnits="userSpaceOnUse">
    <stop offset="0"/>
    <stop offset="1" stop-color="#cebda2"/>
  </linearGradient>
  <linearGradient id="_243-2" x1="1080.67" y1="-3880.13" x2="1124.27" y2="-3880.13" gradientTransform="matrix(0.92, 0.39, 0.39, -0.92, 715.97, -3796.39)" xlink:href="#_243"/>
  <radialGradient id="pet-1" cx="-811.79" cy="-2402.43" r="23.25" gradientTransform="translate(2471.8 1118.9) rotate(-46.42)" gradientUnits="userSpaceOnUse">
    <stop offset="0.1" stop-color="#fff"/>
    <stop offset="0.35" stop-color="#f7f8f8"/>
    <stop offset="0.73" stop-color="#e3e4e5"/>
    <stop offset="1" stop-color="#d0d2d3"/>
  </radialGradient>
  <linearGradient id="pet-2" x1="-304.57" y1="-3123.13" x2="-304.57" y2="-3140.95" gradientTransform="translate(3283.32 483.33) rotate(-76.42)" gradientUnits="userSpaceOnUse">
    <stop offset="0.1" stop-color="#fff"/>
    <stop offset="0.38" stop-color="#f7f7f7"/>
    <stop offset="0.8" stop-color="#e3e3e3"/>
    <stop offset="1" stop-color="#d7d7d7"/>
  </linearGradient>
  <linearGradient id="pet-2-2" x1="2002.99" y1="-523.51" x2="2002.99" y2="-539.67" gradientTransform="translate(183.22 -2013.84) rotate(105.06)" xlink:href="#pet-2"/>
  <linearGradient id="pet-2-3" x1="-305.73" y1="-3118.59" x2="-305.73" y2="-3140.95" xlink:href="#pet-2"/>
  <linearGradient id="pet-2-4" x1="-305.73" y1="-3119.26" x2="-305.73" y2="-3138.91" xlink:href="#pet-2"/>
  <linearGradient id="pet-2-5" x1="-305.79" y1="-3120.1" x2="-305.79" y2="-3137.07" xlink:href="#pet-2"/>
  <linearGradient id="pet-2-6" x1="-305.73" y1="-3120.4" x2="-305.73" y2="-3135.5" xlink:href="#pet-2"/>
  <radialGradient id="pet-1-2" cx="1842.17" cy="152.43" r="23.25" gradientTransform="translate(-1002.2 -1310.17) rotate(42.85)" xlink:href="#pet-1"/>
  <linearGradient id="pet-2-7" x1="716.4" y1="416.43" x2="716.4" y2="398.61" gradientTransform="translate(-356.45 -506.73) rotate(12.85)" xlink:href="#pet-2"/>
  <linearGradient id="pet-2-8" x1="890.48" y1="-4035.37" x2="890.48" y2="-4051.53" gradientTransform="translate(2101.44 -3638.06) rotate(-165.66)" xlink:href="#pet-2"/>
  <linearGradient id="pet-2-9" x1="715.24" y1="420.97" x2="715.24" y2="398.61" gradientTransform="translate(-356.45 -506.73) rotate(12.85)" xlink:href="#pet-2"/>
  <linearGradient id="pet-2-10" x1="715.24" y1="420.29" x2="715.24" y2="400.64" gradientTransform="translate(-356.45 -506.73) rotate(12.85)" xlink:href="#pet-2"/>
  <linearGradient id="pet-2-11" x1="715.19" y1="419.46" x2="715.19" y2="402.49" gradientTransform="translate(-356.45 -506.73) rotate(12.85)" xlink:href="#pet-2"/>
  <linearGradient id="pet-2-12" x1="715.24" y1="419.16" x2="715.24" y2="404.06" gradientTransform="translate(-356.45 -506.73) rotate(12.85)" xlink:href="#pet-2"/>
  <radialGradient id="_160-9" cx="706.41" cy="418.98" r="3.48" gradientTransform="translate(-356.45 -506.73) rotate(12.85)" xlink:href="#_160"/>
  <radialGradient id="_160-10" cx="710.35" cy="414.39" r="3.35" gradientTransform="translate(-356.45 -506.73) rotate(12.85)" xlink:href="#_160"/>
`;
