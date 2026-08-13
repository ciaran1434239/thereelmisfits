export function UpNextRail({ excludeTitleId }: { excludeTitleId: string }) {
  const sidebarContent = [
    {
      title: "The Substance",
      img: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=400&h=225&q=80",
      dir: "Coralie Fargeat"
    },
    {
      title: "Severance",
      img: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=400&h=225&q=80",
      dir: "Dan Erickson"
    },
    {
      title: "Anora",
      img: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&h=225&q=80",
      dir: "Sean Baker"
    }
  ];

  return (
    <div className="flex flex-col gap-8">
      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Up Next</h3>
      <div className="flex flex-col gap-8">
        {sidebarContent.map((item, i) => (
          <div key={i} className="group cursor-pointer">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 mb-3 border border-gray-100">
              <img src={item.img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute bottom-2 right-2 bg-black/80 text-[10px] text-white px-1.5 py-0.5 rounded font-bold">144 MIN</div>
            </div>
            <h4 className="text-[15px] font-black uppercase italic leading-tight group-hover:text-[#FF0000] transition-colors">
              {item.title}
            </h4>
            <div className="flex items-center gap-2 mt-1">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{item.dir}</p>
               <span className="text-gray-200 text-[10px]">•</span>
               <p className="text-[10px] font-black text-emerald-500 uppercase">Verified</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}