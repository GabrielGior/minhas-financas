// Cofrim — Só dados: as moedas em uso no mundo (ISO 4217) e os países (ISO 3166-1). Os nomes em português vêm do próprio
// navegador (Intl.DisplayNames); sem ele, aparece o código. A moeda escolhida formata todos os valores (fmtTexto, em
// util.js); o país diz quais são os feriados e o fim de semana nos cálculos de dia útil (diaUtil, em calculos.js).
const MOEDAS = ['BRL', 'USD', 'EUR', 'GBP', 'ARS', 'CLP', 'COP', 'MXN', 'PEN', 'PYG', 'UYU', 'BOB', 'VES', 'CAD', 'AUD', 'JPY', 'CNY',
  'CHF', 'INR', 'AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'AWG', 'AZN', 'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD', 'BND', 'BSD',
  'BTN', 'BWP', 'BYN', 'BZD', 'CDF', 'CRC', 'CUP', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EGP', 'ERN', 'ETB', 'FJD', 'FKP', 'GEL',
  'GHS', 'GIP', 'GMD', 'GNF', 'GTQ', 'GYD', 'HKD', 'HNL', 'HTG', 'HUF', 'IDR', 'ILS', 'IQD', 'IRR', 'ISK', 'JMD', 'JOD', 'KES', 'KGS',
  'KHR', 'KMF', 'KPW', 'KRW', 'KWD', 'KYD', 'KZT', 'LAK', 'LBP', 'LKR', 'LRD', 'LSL', 'LYD', 'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MNT',
  'MOP', 'MRU', 'MUR', 'MVR', 'MWK', 'MYR', 'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 'NPR', 'NZD', 'OMR', 'PAB', 'PGK', 'PHP', 'PKR', 'PLN',
  'QAR', 'RON', 'RSD', 'RUB', 'RWF', 'SAR', 'SBD', 'SCR', 'SDG', 'SEK', 'SGD', 'SHP', 'SLE', 'SOS', 'SRD', 'SSP', 'STN', 'SVC', 'SYP',
  'SZL', 'THB', 'TJS', 'TMT', 'TND', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS', 'UAH', 'UGX', 'UZS', 'VND', 'VUV', 'WST', 'XAF', 'XCD', 'XCG',
  'XOF', 'XPF', 'YER', 'ZAR', 'ZMW', 'ZWG'];
// Nome de moeda que navegadores mais antigos ainda não conhecem (Intl.DisplayNames devolve só o código).
const MOEDAS_NOMES = {XCG:'Florim do Caribe', ZWG:'Ouro do Zimbábue', SLE:'Leone de Serra Leoa', VES:'Bolívar venezuelano'};
const PAISES = ['BR', 'PT', 'US', 'AR', 'CL', 'CO', 'MX', 'PE', 'PY', 'UY', 'BO', 'VE', 'EC', 'ES', 'CA', 'GB', 'FR', 'DE', 'IT', 'JP',
  'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI',
  'BJ', 'BL', 'BM', 'BN', 'BQ', 'BS', 'BT', 'BV', 'BW', 'BY', 'BZ', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CM', 'CN', 'CR', 'CU',
  'CV', 'CW', 'CX', 'CY', 'CZ', 'DJ', 'DK', 'DM', 'DO', 'DZ', 'EE', 'EG', 'EH', 'ER', 'ET', 'FI', 'FJ', 'FK', 'FM', 'FO', 'GA', 'GD',
  'GE', 'GF', 'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM', 'HN', 'HR', 'HT', 'HU',
  'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR', 'IS', 'JE', 'JM', 'JO', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KP', 'KR', 'KW', 'KY',
  'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK', 'ML', 'MM',
  'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR',
  'NU', 'NZ', 'OM', 'PA', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PW', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW', 'SA', 'SB',
  'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD', 'TF',
  'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ', 'UA', 'UG', 'UM', 'UZ', 'VA', 'VC', 'VG', 'VI', 'VN',
  'VU', 'WF', 'WS', 'YE', 'YT', 'ZA', 'ZM', 'ZW'];
