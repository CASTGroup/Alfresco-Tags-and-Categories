# Alfresco Community Hackathon June 2021 - ACA: Adding TAG and CATEGORY management

This project is the implementation of the idea published on [Alfresco Hub](https://hub.alfresco.com/t5/hackathon-june-2021-projects/aca-adding-tag-and-category-management/idi-p/306633).
We would like to expand Alfresco Content App functionalities to include Tag and Category management for two main reasons:

1. Some of our customers are actively using them and we want to migrate from Share to Content App
2. To make a project that expands ACA functionalities with the minimum amount of modification to ACA code

We take the [Content app release 2.4.0](https://github.com/Alfresco/alfresco-content-app/releases/tag/v2.4.0) as a starting point.

## Tags management

In the [Alfresco Ng2 Components](https://github.com/Alfresco/alfresco-ng2-components/tree/develop/lib/content-services/src/lib/tag) repository is already present a Tag Component, so the integration was quite easy. We just need to add the right selectors in the right places:

- adf-tag-node-list directly in the files.component.html of ACA
- adf-tag-node-actions-list in the metadata tab

The ACA Metadata tab didn't permit an easy way to insert the selector for tag and, later, for categories, so we made a custom metadata tab called my-matadata-tab. To substitute the standard metadata tab we use the ExtensionService (see the [code here](https://github.com/CASTGroup/Alfresco-Tags-and-Categories/blob/main/src/app/modules/castgroup/castgroup.module.ts#L85))

`this.extensions.setComponents({
    'app.components.tabs.metadata': MyMetadataTabComponent
  });`

## My metadata tab component

We started from ACA code and we added the Tag and Category selectors only if the node selected is a [Folder](https://github.com/CASTGroup/Alfresco-Tags-and-Categories/blob/main/src/app/modules/castgroup/my-metadata-tab/my-metadata-tab.component.html#L23), to avoid duplication between the various panel properties

The component during ngOnInit dispatch an Action to load all the [repository Categories](https://github.com/CASTGroup/Alfresco-Tags-and-Categories/blob/main/src/app/modules/castgroup/my-metadata-tab/my-metadata-tab.component.ts#L144) and store them in the [Store](https://github.com/CASTGroup/Alfresco-Tags-and-Categories/blob/main/src/app/modules/castgroup/store/category.effects.ts#L42)

## Category management

For Category management we found nothing and you can't save them with the [classic PUT to update the node](https://api-explorer.alfresco.com/api-explorer/#/nodes/updateNode) because, if you read the documentation, "**Note**: setting properties of type d:content and d:category are not supported".
So we have developed a Webscript that need to be copied in the Data Dictionary\Webscript folder and an Angular component to use it.

You can find the folder "update-categories" in the [_cast](https://github.com/CASTGroup/Alfresco-Tags-and-Categories/tree/main/_cast) directory. You have to copy in your Data Dictionary\Webscript folder.

## Who we are

The group who attended the hackathon:

- Jessica Foroni
- Matteo Battisti
- Carlo Cavallieri
- Leonardo Mattioli

We are employees of [CASTGroup](https://cast.sys-datgroup.com/) a company of the Sys-dat group with 250 employees and 16 branches throughout Italy. We are located in Modena, in the heart of Motor Valley, and since 1987 we do customized software.

We started working with Alfresco in 2010, with version 3.2.

Many thanks to Eddie May and Axel Faust for the organization of the event.
