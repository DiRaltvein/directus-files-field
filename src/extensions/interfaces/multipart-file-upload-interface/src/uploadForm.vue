<template>
  <div>
    <v-dialog
      :model-value="showForm"
      @update:model-value="closeModal"
      :persistent="uploadInProgress"
    >
      <v-card>
        <v-card-title>Upload file</v-card-title>
        <v-card-text>
          <div
            class="custom-upload-form"
            :class="{ dragging, uploading: uploadInProgress }"
            @dragenter.prevent="onDragEnter"
            @dragleave.prevent="onDragLeave"
            @dragover.prevent
            @drop.stop.prevent="onDrop"
          >

            <template v-if="dragging">
              <v-icon class="upload-icon" x-large name="file_upload" />
              <p>Drop to upload</p>
            </template>

            <template v-else-if="uploadInProgress">
              <p>{{ progress }}%</p>
              <v-progress-linear :value="progress" rounded />
            </template>

            <template v-else>
              <div class="actions">
                <v-button icon rounded secondary :disabled="uploadInProgress" @click="$refs.input.click()">
                  <input :disabled="uploadInProgress" ref="input" class="browse" type="file" multiple @input="onUpload" />
                  <v-icon name="file_upload" />
                </v-button>
                <v-button
                  icon
                  rounded
                  secondary
                  @click="() => importFromUrlModalOpen = true"
                  :disabled="uploadInProgress"
                >
                  <v-icon name="link" />
                </v-button>
              </div>

              <p>Drag &amp; Drop a File Here</p>
            </template>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-button @click="closeModal" :disabled="uploadInProgress">done</v-button>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="importFromUrlModalOpen"
      :persistent="uploadInProgress"
      @esc="importFromUrlModalOpen = false"
    >
      <v-card>
        <v-card-title>Import from url</v-card-title>
        <v-card-text>
          <v-input v-model="url" autofocus placeholder="url" :nullable="false" :disabled="uploadInProgress" />
        </v-card-text>
        <v-card-actions>
          <v-button :disabled="uploadInProgress" secondary @click="importFromUrlModalOpen = false">
            cancel
          </v-button>
          <v-button :loading="uploadInProgress" :disabled="uploadInProgress || !isValidUrl" @click="$emit('url', url)">
            import
          </v-button>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	props: {
		showForm: Boolean,
    closeModal: Function,
    uploadInProgress: Boolean,
    progress: Number,
	},
  data() {
    return {
      url: '',
      importFromUrlModalOpen: false,
      dragging: false,
    };
  },
  emits: ['files', 'url'],
  methods: {
    async onUpload(onUploadEvent: Event) {
			const files = (onUploadEvent.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;
			this.$emit('files', files);
    },
    onDrop(event: DragEvent) {
      if (this.uploadInProgress) return;
      this.dragging = false;
      const files = event.dataTransfer?.files;
      if (!files || files.length === 0) return;
			this.$emit('files', files);
    },
    onDragEnter() {
      this.dragging = true;
    },
    onDragLeave() {
      this.dragging = false;
    },
  },
  watch: {
    showForm() {
      this.importFromUrlModalOpen = false;
      this.url = '';
    }
  },
  computed: {
    isValidUrl() {
      try {
			  new URL(this.url);
        return true;
      } catch {
        return false;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.custom-upload-form {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: var(--input-height-tall);
  padding: 32px;
  color: var(--theme--foreground-subdued);
  text-align: center;
  border: var(--theme--border-width) dashed var(--theme--form--field--input--border-color);
  border-radius: var(--theme--border-radius);
  transition: var(--fast) var(--transition);
  transition-property: color, border-color, background-color;

  &.dragging {
    color: var(--theme--primary);
    background-color: var(--theme--primary-background);
    border-color: var(--theme--form--field--input--border-color-focus);

    * {
      pointer-events: none;
    }

    .upload-icon {
      margin: 0 auto;
      margin-bottom: 12px;
    }
  }

  &.uploading {
    --v-progress-linear-color: var(--white);
    --v-progress-linear-background-color: rgb(255 255 255 / 0.25);
    --v-progress-linear-height: 8px;

    color: var(--white);
    background-color: var(--theme--primary);
    border-color: var(--theme--form--field--input--border-color-focus);
    border-style: solid;

    .v-progress-linear {
      position: absolute;
      bottom: 30px;
      left: 32px;
      width: calc(100% - 64px);
    }
  }

  .actions {
    display: flex;
    justify-content: center;
    margin-bottom: 18px;
    gap: 10px;
  }

	.browse {
		position: absolute;
		top: 0;
		left: 0;
		display: block;
		width: 100%;
		height: 100%;
		cursor: pointer;
		opacity: 0;
		appearance: none;
	}

	> p {
		font-size: 16px;
    font-weight: var(--theme--form--field--label--font-weight);
    font-family: var(--theme--form--field--label--font-family);
    font-style: normal;
    line-height: 19px;
	}
}
</style>
