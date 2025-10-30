export class ImageRecognitionModel {
  id: string | number;
  // Defina aqui as propriedades do modelo caso exista/precisa
  // Lembrando que caso exista a entidade, não tem necessidade de model

  constructor(data: Partial<ImageRecognitionModel>) {
    this.id = data.id;
  }
}
