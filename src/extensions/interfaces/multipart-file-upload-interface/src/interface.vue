<!-- https://docs.directus.io/extensions/interfaces.html -->
<!-- https://github.com/directus/directus/blob/main/app/src/interfaces/files/files.vue -->
<!-- https://github.com/directus/directus/blob/64fd6701d80f631419f31957ee4efe0cff25f656/app/src/components/v-upload.vue#L4 -->

<template>
  <div>
    <component
      :is="DirectusFilesComponent"
      v-bind="{ ...$attrs, ...$props }"
      @input="emit"
    />

    <upload-form
      :uploadInProgress="uploadInProgress"
      :showForm="showUpload"
      :closeModal="() => showUpload = false"
      :progress="progress"
      @files="onUpload"
      @url="importFromUrl"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useApi, useExtensions } from '@directus/extensions-sdk';
import UploadForm from './uploadForm.vue';
import { AxiosResponse } from 'axios';

interface IComponentData {
  showUpload: boolean;
  uploadInProgress: boolean;
  progress: number;
  inputChangedState: {
    create: { chapter_id: string; directus_files_id: { id: string; } }[],
    delete: string[],
    update: any[]
  },
}

export default defineComponent({
	props: {
		primaryKey: String,
		field: String,
    value: Object,
    width: String,
    type: String,
    collection: String,

    folder: String,
    template: String,
    limit: Number,
    enableSelect: Boolean,
    enableCreate: Boolean,
	},
  components: {
    UploadForm,
  },
  emits: ['input', 'setFieldValue'],
  data(): IComponentData {
    return {
      showUpload: false,
			uploadInProgress: false,
      progress: 0,
      inputChangedState: {
        create: [],
        delete: [],
        update: []
      },
    };
  },
  setup() {
    const api = useApi();
    const { interfaces } = useExtensions();
    const data = interfaces.value.find(int => int.id === 'files');

    return {
      api,
      DirectusFilesComponent: data?.component,
    };
  },
  mounted() {
    if (!this.$props.enableCreate) return;
    const button = (this.$el as HTMLDivElement).querySelector('.actions > div button');
    button?.addEventListener('click', (event: Event) => {
      event.stopImmediatePropagation();
      this.showUpload = true;
    }, true);
  },
  methods: {
    emit(data: unknown) {
      this.inputChangedState = data as any;
      // log inputChangedState value
      console.log('STANDARD', JSON.parse(JSON.stringify(this.inputChangedState)));
      this.$emit('input', this.inputChangedState);
    },
    async emitChange(uploadedFileGuids: string[]) {
      // at this point file has been uploaded and method receives list of guides of uploaded files.
      // not the most crucial part, tell directus to include uploaded files so that user can also see that files have
      // reached therirs destination
      const uploadedFilesCreateField = uploadedFileGuids.map(guid => ({
        chapter_id: this.primaryKey!,
        directus_files_id: { id: guid }
      }))
      this.inputChangedState.create = this.inputChangedState.create.concat(uploadedFilesCreateField);
      // log inputChangedState value
      console.log('CUSTOM', JSON.parse(JSON.stringify(this.inputChangedState)));
      this.$emit('setFieldValue', {
        field: this.field,
        value: this.inputChangedState,
      });
    },
    async onUpload(files: FileList) {
			this.uploadInProgress = true;
      const uploadedFileGuids: string[] = [];
			for (let i = 0; i < files.length; i++) {
				const response = await this.uploadFile(files.item(i));
        if (response) uploadedFileGuids.push(response);
			}
      await this.emitChange(uploadedFileGuids);
			this.uploadInProgress = false;
			this.showUpload = false;
    },
    async importFromUrl() {
      // removed as not needed to demo
      this.uploadInProgress = false;
			this.showUpload = false;
    },
    async uploadFile(file: File | null): Promise<string | undefined> {
      if (!file) return;
			let offset = 0;
      let chunkNumber = 1;
      const CHUNK_SIZE = 52428800; // 50MB chunk size

			const filename = file.name;
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

      let finalResponse;
      while (offset < file.size) {
        const chunk = file.slice(offset, offset + CHUNK_SIZE);
        finalResponse = await this.uploadChunk(filename, chunk, chunkNumber++, totalChunks);
        offset += CHUNK_SIZE;
      }
      return finalResponse?.data?.fileGuid;
    },
    async uploadChunk(filename: string, chunk: Blob, chunkNumber: number, totalChunks: number): Promise<AxiosResponse<{ fileGuid: string; }>> {
      const url = new URL('/storage/upload', window.location.origin);
      url.searchParams.append('chunkNumber', chunkNumber.toString());
      url.searchParams.append('filename', filename.toString());
      url.searchParams.append('totalChunks', totalChunks.toString());
      return await this.api.post(url.toString(), chunk, { headers: { 'Content-Type': 'application/octet-stream' } });
    },
  },
});
</script>

<style lang="scss" scoped>
.actions {
	display: flex;
	justify-content: center;
	margin-bottom: 18px;
	gap: 10px;
}
</style>
