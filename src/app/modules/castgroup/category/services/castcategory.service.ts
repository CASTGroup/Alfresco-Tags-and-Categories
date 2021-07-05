import { Injectable, Output, EventEmitter } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
//import { throwError } from 'rxjs';

import { AlfrescoApiService, LogService } from '@alfresco/adf-core';
import { BasicAuth } from '@alfresco/js-api/src/authentication/basicAuth';
import { throwError } from 'rxjs';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  })
};

@Injectable({
  providedIn: 'root'
})
export class CastCategoryService {
  private baseUrl = '';
  private ticket: BasicAuth;

  @Output()
  refresh = new EventEmitter<{ nodeId: string; categories?: string[] | null; error?: string }>();

  constructor(private httpClient: HttpClient, private alfrescoApiService: AlfrescoApiService, private logService: LogService) {}

  setCategory(nodeId: string, values: string[]) {
    // Using the user ticket
    this.baseUrl = this.alfrescoApiService.lastConfig.hostEcm;
    this.ticket = this.alfrescoApiService.contentApi.apiClient.authentications.basicAuth;
    let tmp = btoa(this.ticket.username + ':' + this.ticket.password);
    httpOptions.headers = httpOptions.headers.append('Authorization', 'Basic ' + tmp);

    // Construct the body for the put
    let body = '{ "noderef": "' + nodeId + '", ' + '"categories": [';
    values.forEach((value) => {
      body += '{ "id": "' + value + '"},';
    });
    body += ']}';

    // Call IT!
    this.httpClient.put(this.baseUrl + '/alfresco/s/updateCategories', body, httpOptions).subscribe(
      () => {
        this.refresh.emit({ nodeId: nodeId, categories: values }); //if someone needs something back
      },
      (err: HttpErrorResponse) => {
        this.logService.error(err);
        this.refresh.emit({ nodeId: nodeId, error: err.toString() });
        return throwError(err || 'Server error');
      }
    );
  }
}
