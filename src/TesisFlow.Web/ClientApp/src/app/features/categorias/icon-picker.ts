import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ICONES_CATEGORIA, IconeCategoria } from './categoria-icones';

@Component({
  selector: 'app-icon-picker',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './icon-picker.html',
  styleUrl: './icon-picker.scss',
})
export class IconPickerComponent {
  @Input() icone = 'task_alt';
  @Input() cor = '#ff8615';
  @Output() selecionar = new EventEmitter<IconeCategoria>();

  icones = ICONES_CATEGORIA;

  escolher(i: IconeCategoria) {
    this.selecionar.emit(i);
  }
}
