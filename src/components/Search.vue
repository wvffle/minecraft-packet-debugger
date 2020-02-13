<template>
  <div class="relative">
    <div v-if="searchQueryLastWord !== ''" class="absolute w-full left-0 rounded-b shadow bg-white mb-4 overflow-hidden overflow-y-auto" style="top: 100%; max-height: 60vh">
      <div class="text-lg p-2">to:server</div>
      <template v-for="packet in spackets.toServer">
        <div v-if="packet.includes(searchQueryLastWord)" @click="searchReplaceLast(packet)" class="border-b border-gray-300 text-xs p-2 cursor-pointer flex">
          <UploadCloudIcon class="stroke-1 mr-2 text-green-400" size="1.5x"></UploadCloudIcon>
          {{ packet }}
        </div>
      </template>
      <div class="text-lg p-2">to:client</div>
      <template v-for="packet in spackets.toClient">
        <div v-if="packet.includes(searchQueryLastWord)" @click="searchReplaceLast(packet)" class="border-b border-gray-300 text-xs p-2 cursor-pointer flex">
          <DownloadCloudIcon class="stroke-1 mr-2 text-blue-400" size="1.5x"></DownloadCloudIcon>
          {{ packet }}
        </div>
      </template>
    </div>

    <input v-model='query' :class="{ 'rounded-b-0': searchQueryLastWord }" ref="search" type="text" placeholder="Search packets" class="bg-white border bg-gray-200 focus:bg-white focus:border-gray-300 focus:outline-none rounded-lg py-2 pr-4 pl-10 block w-full appearance-none leading-normal placeholder-gray-600">
    <SearchIcon class="absolute text-gray-600 pointer-events-none top-0 left-0 mt-2 ml-3" size="1.5x"/>
  </div>
</template>

<script>
  import { SearchIcon, UploadCloudIcon, DownloadCloudIcon } from 'vue-feather-icons'
  export default {
    name: 'Search',

    components: {
      SearchIcon,
      UploadCloudIcon,
      DownloadCloudIcon
    },

    props: {
      packets: { type: Object, required: true },
      value: { type: String, required: true }
    },

    watch: {
      packets (to) {
        this.spackets = to
      },

      query (to) {
        this.$emit('input', to)
      }
    },

    computed: {
      searchQueryWords () {
        return this.query.split(' ')
      },
      searchQueryLastWord () {
        return this.searchQueryWords.slice(-1)[0]
      }
    },

    methods: {
      searchReplaceLast (packet) {
        const query = this.searchQueryWords
        query[query.length - 1] = packet
        this.query = query.join(' ') + ' '
        this.$refs.search.focus()

        this.$nextTick(() => {
          this.$emit('select', [packet])
        })
      }
    },

    data () {
      return {
        query: '',
        spackets: {
          toClient: [],
          toServer: []
        }
      }
    },

    created () {
      this.spackets = this.packets

      this.$nextTick(() => {
        this.$refs.search.addEventListener('keyup', (evt) => {
          if (evt.key !== 'Enter') {
            return
          }

          const packets = this.searchQueryWords.filter(p => {
            return this.spackets.toClient.includes(p)
              || this.spackets.toServer.includes(p)
          })

          this.$nextTick(() => {
            this.$emit('select', packets)
          })
        })
      })
    }
  }
</script>

<style scoped>

</style>
