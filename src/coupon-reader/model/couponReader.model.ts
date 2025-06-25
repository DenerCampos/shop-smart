import axios from 'axios';
import cheerio from 'cheerio';
import { ItemReaderModel } from './itemReader.model';
import { val } from 'cheerio/lib/api/attributes';

interface IDescriptionAndCode {
  code: string;
  description: string;
}

type Store = {
  name: string;
};

type Payment = {
  name: string;
};

export class CouponReaderModel {
  url: string;
  uri: string;
  name?: string;
  date?: Date;
  value: number;
  repeat: boolean;
  payment: Payment;
  store: Store;
  items: ItemReaderModel[] = [];
  baseUrl =
    'https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml?p=';

  constructor(url: string) {
    this.url = `${this.baseUrl}${url}`;
    this.uri = url;
    this.date = new Date();
    this.value = 0;
    this.repeat = false;
    this.payment = { name: '' };
    this.store = { name: '' };
  }

  private convertStringToDecimal(value: string): number {
    const number = parseFloat(value.replace(',', '.'));
    const formattedNumber = number.toFixed(2);
    return parseFloat(formattedNumber);
  }

  private extractDecimalValue(str: string): number {
    const regex = /R\$\s*([\d,]+)/;
    const match = regex.exec(str);

    const value = match ? match[1] : null;
    if (value !== null) {
      return this.convertStringToDecimal(value);
    }

    return 0;
  }

  private extractAfterColon(str: string): string | null {
    const regex = /:\s*(.*)/;
    const match = regex.exec(str);

    return match ? match[1] : null;
  }

  private extractTotalQuantity(str: string): string | null {
    const regex = /Qtde total de ítens:\s*(\d+(?:\.\d+)?)/;
    const match = regex.exec(str);

    return match ? match[1] : null;
  }

  private extractDescriptionAndCode(str: string): IDescriptionAndCode {
    const regex = /(.+)\s+\(Código:\s+(\d+)\)/;
    const match = regex.exec(str);

    const result: IDescriptionAndCode = {
      code: '',
      description: '',
    };

    if (match) {
      result.description = match[1]; // "AMAC R COMF CON 1L"
      result.code = match[2]; // "1262087"
    }

    return result;
  }

  private calculateUnitValue(quantity: number, totalValue: number): number {
    const value = (totalValue / quantity).toFixed(2);

    return this.convertStringToDecimal(value);
  }

  private getItems(elementHtml: any): ItemReaderModel {
    const $ = cheerio.load(elementHtml);

    const item = {
      code: '',
      name: '',
      quantity: 0,
      unit: '',
      total: 0,
      value: 0,
    };

    $(elementHtml)
      .children('td')
      .each((index, element) => {
        if (index === 0) {
          const { code: itemCode, description: itemName } =
            this.extractDescriptionAndCode($(element).text());
          item.code = itemCode;
          item.name = this.capitalize(itemName);
        }

        if (index === 1) {
          item.quantity = parseFloat(
            this.extractTotalQuantity($(element).text()),
          );
        }

        if (index === 2) {
          item.unit = this.extractAfterColon($(element).text());
        }

        if (index === 3) {
          item.total = this.extractDecimalValue($(element).text());
          if (item.quantity && item.total) {
            item.value = this.calculateUnitValue(item.quantity, item.total);
          }
        }
      });

    return new ItemReaderModel(item);
  }

  private capitalize(str: string): string {
    if (!str || typeof str !== 'string') {
      return '';
    }

    const trimmedStr = str.trim();

    if (trimmedStr.length === 0) {
      return '';
    }

    return (
      trimmedStr.charAt(0).toUpperCase() + trimmedStr.slice(1).toLowerCase()
    );
  }

  public async readUrl() {
    try {
      const response = await axios.get(this.url);
      const html = response.data;
      const $ = cheerio.load(html);

      const divData = $('.container');
      const name = divData.find('table').find('.text-uppercase').first().text();

      if (name) {
        this.name = this.capitalize(name);
      }

      const dataTable = divData.find('#myTable');

      if (dataTable) {
        dataTable.children('tr').each((index, element) => {
          const item = this.getItems(element);

          this.items.push(item);
        });
      }

      const value = this.items.reduce((total, item) => total + item.total, 0);
      this.value = this.convertStringToDecimal(value.toString());
    } catch (error) {
      console.error('Error fetching URL:', error);
      throw new Error('Error fetching URL');
    }
  }
}
