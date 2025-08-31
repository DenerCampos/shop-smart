export class ThemeModel {
  id: string | number;
  // Defina aqui as propriedades do modelo caso exista/precisa
  // Lembrando que caso exista a entidade, não tem necessidade de model

  constructor(data: Partial<ThemeModel>) {
    this.id = data.id;
  }
}
