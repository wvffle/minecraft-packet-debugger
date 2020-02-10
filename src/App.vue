<template>
  <div class="h-screen grid grid-cols-3 gap-5 mx-5" style="grid-template-rows: max-content 1fr">
    <div class="col-span-2 rounded shadow-lg bg-white px-6 py-4 my-5">
      <div class="text-gray-400 flex items-center justify-center">
      <span class="mr-auto">
        <TrashIcon class="stroke-1 opacity-0" size="2x"/>
      </span>
        <span v-if="record.state" title="Start recording new packets" class="cursor-pointer mr-5" @click='stopRecording'>
          <PauseCircleIcon class="stroke-1 text-teal-400" size="2x"></PauseCircleIcon>
        </span>
        <span v-if="!record.state" title="Start recording new packets" class="cursor-pointer mr-5" @click='startRecording'>
          <PlayCircleIcon class="stroke-1 hover:text-teal-400" size="2x"></PlayCircleIcon>
        </span>
        <span title="Clear the packets window" class="cursor-pointer ml-auto" @click='packets = []'>
          <TrashIcon class="stroke-1 hover:text-teal-400" size="2x"></TrashIcon>
        </span>
      </div>
    </div>
    <div class="rounded shadow-lg bg-white px-6 py-4 my-5 relative">
      <input v-bind='searchQuery' type="text" placeholder="Search packets" class="bg-white border bg-gray-200 focus:bg-white focus:border-gray-300 focus:outline-none rounded-lg py-2 pr-4 pl-10 block w-full appearance-none leading-normal placeholder-gray-600">
      <SearchIcon class="absolute text-gray-600 pointer-events-none top-0 left-0 mt-6 ml-8" size="1.5x"/>
    </div>
    <div class="col-span-2 relative my-5 rounded shadow-lg overflow-y-auto max-h-full" id="packets">
      <!--      <VirtualList :items="packets" :item-size="56" v-slot="{ packet }">-->
      <div v-for="packet in packets">
        <!--          Transition -->
        <div class="py-4 px-6 cursor-pointer" @click='open(packet)'>
          <!--          <div v-if="(searchQuery !== '' && packet.meta.name.includes(searchQuery)) || (searchQuery === '' && filters[packet.meta.name] !== true)" class="flex">-->
          <div class="flex">

            <UploadCloudIcon v-if="packet.to === 1" class="stroke-1 mr-2 text-green-400" size="1.5x"></UploadCloudIcon>
            <DownloadCloudIcon v-if="packet.to === 0" class="stroke-1 mr-2 text-blue-400" size="1.5x"></DownloadCloudIcon>

            <pre>{{packet.meta.name}}</pre>
            <div class="ml-auto">
              <div class="text-gray-400 hover:text-teal-400 cursor-pointer" @click.stopPropagation='filters[packet.meta.name] = true'>
                <FilterIcon size="1.2x"/>
              </div>
            </div>
          </div>
        </div>
        <!--        Transition -->
        <div v-if="packet === id_open" class="px-6">
          <div class="border-b border-gray-200 mb-4"></div>
          <div class="grid mb-4" style="grid-template-columns:min-content 1fr">
            <div>
              <div class="flex-1 text-sm" v-for="(tab, idx) in tabs">
                <a :class="{ 'text-teal-400': id_tab === idx, 'hover:text-teal-400 text-gray-600': id_tab !== idx }" class="cursor-pointer block py-2 px-8" @click="id_tab = idx">{{ tab }}</a>
              </div>
            </div>
            <div class="ml-4">
              <pre v-if="id_tab === 0" class="text-xs rounded bg-gray-100 p-4" v-html="formatJSON(packet.data)"></pre>
              <pre v-if="id_tab === 1" class="text-xs rounded bg-gray-100 p-4" v-html="formatJSON(packet.meta)"></pre>
            </div>
          </div>
        </div>

        <div class="border-b border-gray-300"></div>
      </div>
      <!--      </VirtualList>-->
    </div>
    <div class="p-5 row-span-2 grid" style="grid-template-rows: min-content 1fr">
      <div class="text-xl pb-2">
        Filtered packets
        <span v-if="Object.keys(filters).length" @click='filters = Object.create(null)' title="Clear all filters" class="float-right cursor-pointer">
          <TrashIcon class="stroke-1 text-gray-400 hover:text-teal-400" size="1.5x"></TrashIcon>
        </span>
      </div>
      <div class="overflow-y-auto h-full">
        <template v-for="packet in Object.keys(filters)">
          <div v-if="filters[packet]" class="text-xs flex items-center pb-3 pt-4 border-b border-gray-400">
            <pre>{{packet}}</pre>
            <div class="ml-auto mr-4 hover:bg-red-600 hover:text-white text-red-400 p-1 rounded cursor-pointer" @click='filters[packet] = false'>
              <XIcon size="1.2x"/>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
<script>
  import {
    FilterIcon,
    XIcon,
    PlayCircleIcon,
    SearchIcon,
    TrashIcon,
    ServerIcon,
    UploadCloudIcon,
    DownloadCloudIcon,
    PauseCircleIcon,
  } from 'vue-feather-icons'
  import { RecycleScroller } from 'vue-virtual-scroller'
  import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
  import formatJSON from 'json-format-highlight'
  import msgpack from 'msgpack-lite'

  export default {
    components: {
      FilterIcon,
      XIcon,
      PlayCircleIcon,
      SearchIcon,
      TrashIcon,
      ServerIcon,
      UploadCloudIcon,
      DownloadCloudIcon,
      PauseCircleIcon,
      VirtualList: RecycleScroller
    },
    methods: {
      formatJSON (...args) {
        return formatJSON(...args)
      },
      open (packet) {
        this.id_tab = 0

        if (this.id_open === packet) {
          return this.id_open = null
        }

        this.id_open = packet
      },

      startRecording () {
        this.ws = new WebSocket('ws://localhost:3000/ws')
        this.record.packets = []
        this.record.state = 1

        this.ws.onmessage = async (message) => {
          const arrayBuffer = await message.data.arrayBuffer()
          const data = msgpack.decode(new Uint8Array(arrayBuffer))
          this.record.packets.push(data.packet)
        }

      },
      stopRecording () {
        this.ws.close()
        this.ws = null
        this.record.state = 0

        this.packets = this.record.packets
        this.record.packets = []
      }
    },
    data () {
      return {
        searchQuery: '',
        listening: false,
        id_open: null,
        id_tab: 0,
        ws: null,
        record: {
          packets: [],
          state: 0
        },
        tabs: [
          'Packet',
          'Meta'
        ],
        packets: [{
          to: 'server',
          data: {
            meh: 1
          },
          meta: {
            name: 'dummy'
          },
          open: false
        }],
        filters: {
          entity_head_rotation: true,
          entity_teleport: true,
          entity_status: true,
          entity_metadata: true,
          entity_move_look: true,
          entity_destroy: true,
          rel_entity_move: true,

          keep_alive: true,
          map_chunk: true,
          update_time: true,
          game_state_change: true,

          look: true,
          position: true,
          position_look: true,
          arm_animation: true,

          block_change: true
        }
      }
    },
    created () {
    }
  }
</script>
