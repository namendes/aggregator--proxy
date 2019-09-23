import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material';
import { PageService } from './page.service';
import { Page } from '../model/page';
import {Container} from "../model/container";
import UiExtension from "@bloomreach/ui-extension";

@Component({
  selector: 'app-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.css']
})

export class PageComponent implements OnInit {
  displayedColumns: string[] = ['name', 'selector', 'save', 'delete'];
  dataSource = new MatTableDataSource<any>();

  newContainer = undefined;
  pageId = "1";
  loading = false;
  page: Page= new Page();

  ui= undefined;

  constructor(public pageService: PageService) {
  }

  ngOnInit() {
    this.load();
  }

  load() {
    let promise = new Promise((resolve, reject) => {
      UiExtension.register()
        .then(
          res => {
            console.log( "load"+ JSON.stringify(res))
            // Success
            this.loadPage(res)
            //res.channel.page.on('navigate', (res) => this.loadPage);
            resolve();
          },
          msg => {
            console.log("message ",msg)
            // Error
            reject(msg);
          }
        );
    });
    //console.log("as"+ JSON.stringify(promise))
    return promise;
  }

  loadPage(ui) {
   this.ui = ui;
    let promise = new Promise((resolve, reject) => {
      ui.channel.page.get()
        .then(
          res => {
          //  this.ui = res;
            // Success
            this.pageId = res.id;
            this.refresh();
            resolve();
          },
          msg => {
            // Error
            reject(msg);
          }
        );
    });
    return promise;
  }

  refreshPage() {

    let promise = new Promise((resolve, reject) => {
      this.ui.channel.page.refresh()
        .then(
          res => {
            console.log("res" + res);
            //res.channel.page.refresh()
            // Success
           // this.pageId = res.id;
            //this.refresh();
            resolve();
          },
          msg => {
            // Error
            reject(msg);
          }
        );
    });
    return promise;
  }

  async refresh() {
    this.loading = true;
    this.page = await this.pageService.getPage(this.pageId);

    this.dataSource.data = this.page.containers;
    this.loading = false;
    //let test = this.refreshPage(this.ui);
  //  console.log("test" +JSON.stringify(test) );

   // console.log( "s"+ JSON.stringify(this.page))

    /*UiExtension.register().then((ui) => {
      //showUiProperties(ui);

      //ui.channel.page.get().then(showPageProperties);
      //ui.channel.page.on('navigate', showPageProperties);
      ui.channel.refresh()

      //onClick('refreshChannel', () => ui.channel.refresh());
      //onClick('refreshPage', () => ui.channel.page.refresh());
    });*/

  }

  async updateContainerName(container:Container) {
    this.loading = true;
    await this.pageService.updateContainer(this.pageId,container);
    await this.refresh();
     this.refreshPage();
  }

  async addContainer(){
    this.loading = true;
    let item = new Container(this.newContainer,"", "top");

    await this.pageService.updateContainer(this.pageId,item);
    //this.page.containers.push(item);

    this.newContainer = undefined;
    //this.dataSource.data = this.page.containers;
    await this.refresh();

  }

  async deleteContainer(container: Container) {
    this.loading = true;
   // if (confirm(`Are you sure you want to delete the container ${container.name}. This cannot be undone.`)) {
    await this.pageService.deleteContainer(this.pageId,container.name);
   // }
    await this.refresh();
     this.refreshPage();
  }

}

