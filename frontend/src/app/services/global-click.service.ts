import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GlobalClickService {
  private renderer: Renderer2;
  private clickSubject = new Subject<MouseEvent>();
  clicks$ = this.clickSubject.asObservable();
  private removeListener: (() => void) | null = null;

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  startListening() {
    if (!this.removeListener) {
      this.removeListener = this.renderer.listen('document', 'click', (event: MouseEvent) => {
        this.clickSubject.next(event);
      });
    }
  }

  stopListening() {
    if (this.removeListener) {
      this.removeListener();
      this.removeListener = null;
    }
  }
}
