import { TransactionPOS, AppSettings } from '../types';

export const formatCurrency = (amount: number): string => {
  return 'Rp ' + Number(amount || 0).toLocaleString('id-ID');
};

export const formatDate = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return isoString;
  }
};

/**
 * Generate 32-column fixed width thermal receipt text for 58mm printers
 */
export const generatePlainTextReceipt = (trx: TransactionPOS, settings: AppSettings): string => {
  const LINE_WIDTH = 32;
  const pad = (str: string, length: number, fill = ' ') => {
    return str.length > length ? str.substring(0, length) : str.padEnd(length, fill);
  };
  const alignRight = (str: string, length: number) => {
    return str.length > length ? str.substring(0, length) : str.padStart(length, ' ');
  };
  const center = (str: string, length: number) => {
    const space = Math.max(0, length - str.length);
    const left = Math.floor(space / 2);
    const right = space - left;
    return ' '.repeat(left) + str + ' '.repeat(right);
  };
  const lineTwoCols = (left: string, right: string) => {
    const available = LINE_WIDTH - right.length;
    return pad(left, available) + right;
  };
  const divider = '-'.repeat(LINE_WIDTH);
  const doubleDivider = '='.repeat(LINE_WIDTH);

  let text = '';
  text += center(settings.store_name, LINE_WIDTH) + '\n';
  text += center(settings.store_tagline, LINE_WIDTH) + '\n';
  text += center(settings.store_address, LINE_WIDTH) + '\n';
  text += center(`Telp: ${settings.store_phone}`, LINE_WIDTH) + '\n';
  text += divider + '\n';

  text += lineTwoCols('No Inv :', trx.no_invoice) + '\n';
  text += lineTwoCols('Tgl    :', formatDate(trx.tanggal)) + '\n';
  text += lineTwoCols('Kasir  :', trx.kasir) + '\n';
  if (trx.catatan) {
    text += lineTwoCols('Ket/Meja:', trx.catatan) + '\n';
  }
  text += doubleDivider + '\n';

  // Items
  trx.items.forEach(item => {
    text += item.nama + '\n';
    const detail = `  ${item.qty} x ${formatCurrency(item.harga)}`;
    const sub = formatCurrency(item.subtotal);
    text += lineTwoCols(detail, sub) + '\n';
  });

  text += divider + '\n';
  text += lineTwoCols('Subtotal', formatCurrency(trx.subtotal)) + '\n';
  if (trx.diskon > 0) {
    text += lineTwoCols('Diskon', `-${formatCurrency(trx.diskon)}`) + '\n';
  }
  text += lineTwoCols('TOTAL', formatCurrency(trx.total)) + '\n';
  text += divider + '\n';

  text += lineTwoCols('Metode Bayar', trx.metode_bayar) + '\n';
  text += lineTwoCols('Bayar', formatCurrency(trx.bayar)) + '\n';
  text += lineTwoCols('Kembalian', formatCurrency(trx.kembali)) + '\n';
  text += lineTwoCols('Status', trx.status) + '\n';
  text += doubleDivider + '\n';

  text += center('TERIMA KASIH SUDAH MAMPIR!', LINE_WIDTH) + '\n';
  text += center(`Follow IG: ${settings.store_ig}`, LINE_WIDTH) + '\n';
  text += center('Tongkrongan Asik, Rasa Autentik', LINE_WIDTH) + '\n\n\n';

  return text;
};

/**
 * Generate RawBT Android intent URL scheme: rawbt:base64,...
 */
export const generateRawBTUrl = (trx: TransactionPOS, settings: AppSettings): string => {
  const plainText = generatePlainTextReceipt(trx, settings);
  // ESC/POS commands: Initialize printer (ESC @), Line feed
  const escPosInit = '\x1B\x40';
  const escPosCut = '\x1D\x56\x41\x03'; // Cut paper
  const fullContent = escPosInit + plainText + escPosCut;
  
  // Base64 encode
  try {
    const utf8Bytes = new TextEncoder().encode(fullContent);
    let binary = '';
    utf8Bytes.forEach(b => (binary += String.fromCharCode(b)));
    const base64 = btoa(binary);
    return `rawbt:base64,${base64}`;
  } catch (e) {
    const base64 = btoa(unescape(encodeURIComponent(plainText)));
    return `rawbt:base64,${base64}`;
  }
};

/**
 * WhatsApp share message formatter
 */
export const generateWhatsAppReceiptUrl = (trx: TransactionPOS, settings: AppSettings): string => {
  const text = `*STRUK PEMBELIAN ${settings.store_name}*
${settings.store_tagline}
--------------------------------
*No. Invoice:* ${trx.no_invoice}
*Tanggal:* ${formatDate(trx.tanggal)}
*Kasir:* ${trx.kasir}
${trx.catatan ? `*Catatan:* ${trx.catatan}\n` : ''}--------------------------------
*Pesanan:*
${trx.items.map(item => `• ${item.nama}\n   ${item.qty}x ${formatCurrency(item.harga)} = ${formatCurrency(item.subtotal)}`).join('\n')}
--------------------------------
*Subtotal:* ${formatCurrency(trx.subtotal)}
${trx.diskon > 0 ? `*Diskon:* -${formatCurrency(trx.diskon)}\n` : ''}*TOTAL:* ${formatCurrency(trx.total)}
--------------------------------
*Metode:* ${trx.metode_bayar}
*Bayar:* ${formatCurrency(trx.bayar)}
*Kembali:* ${formatCurrency(trx.kembali)}
*Status:* ${trx.status}
================================
_Terima kasih sudah ngopi di ${settings.store_name}!_
_Follow IG kami di ${settings.store_ig}_`;

  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
};
