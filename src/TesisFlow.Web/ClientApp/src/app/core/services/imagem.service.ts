import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ImagemService {
  constructor(private api: ApiService) {}

  upload(imagem: File): Observable<{ url: string }> {
    const form = new FormData();
    form.append('imagem', imagem);
    return this.api.postFormData<{ url: string }>('Imagens/upload', form);
  }
}
