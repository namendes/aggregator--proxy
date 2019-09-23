import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Container} from "../model/container";

const baseUrl = 'http://localhost:8080/site/rest';

@Injectable({
  providedIn: 'root'
})
export class PageService {

  constructor( private http: HttpClient) {
  }

  private async request(method: string, url: string, data?: any) {

    console.log('request ' + JSON.stringify(data));
    const result = this.http.request(method, url, {
      body: data,
      responseType: 'json',
      observe: 'body',
      /*headers: new HttpHeaders({ "Accept": "application/json" })*/
      /*headers: {
        "Content-Type": "json"
      }*/
    });
    return new Promise<any>((resolve, reject) => {
      result.subscribe(resolve as any, reject as any);
    });
  }


  getPage(id: string) {
    console.log("id"+ id);
    return this.request('get', `${baseUrl}/page/id/${id}`);
  }

 /* addContainer(container: Container) {
    //console.log('createProduct ' + JSON.stringify(container));
    return this.request('post', `${baseUrl}/page/add/${id}`, container);
  }*/

  updateContainer(id:string, container: Container) {
    console.log('updateContainer ' + JSON.stringify(container));
    const payload = new HttpParams()
      .set('name', container.name)
      .set('selector', container.selector)
      .set('mode', container.mode);
    return this.request('post', `${baseUrl}/page/id/${id}`, payload);
  }


  deleteContainer(id:string, name: string) {
    const payload = new HttpParams()
      .set('name', name)

    return this.request('delete', `${baseUrl}/page/id/${id}`,payload);
  }
}
